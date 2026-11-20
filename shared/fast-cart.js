import { fetchOne } from "./api.js";
import { isLoggedIn, getCurrentUser } from "./auth.js";

import {
    getCart,
    updateQuantity,
    removeFromCart,
    cartCount
} from "./cart-storage.js";

let overlay;
let fastCart;
let cartItems;
let cartSubtotal;
let cartButton;
let cartBadge;
let closeButton;

let renderVersion = 0;
let previousFocus = null;


const FAVORITES_KEY_PREFIX = "vario_favorites_v1";

/* FORMAT PRICE */

function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(price);
}

/* FAVORITES */

function getFavoritesKey() {
   const user = getCurrentUser();

   if (!isLoggedIn() || !user?.email) {
    return null;
   }

   return `${FAVORITES_KEY_PREFIX}_${user.email.toLowerCase()}`;
 }

 function getFavorites() {
    const key = getFavoritesKey();

    if (!key) return [];

    try { 
        const favorites = JSON.parse(localStorage.getItem(key));
        return Array.isArray(favorites) ? favorites : [];
    } catch {
        return [];
    }
 }

 function isFavorite(id) {
    return getFavorites().includes(id);
 }

 function toggleFavorite(id) {
    const key = getFavoritesKey();

    if (!key) return false;

 const favorites = getFavorites();

 const updated = favorites.includes(id) ? favorites.filter((favoriteId) => favoriteId !== id) : [...favorites, id];

 localStorage.setItem(key, JSON.stringify(updated));

    window.dispatchEvent(
        new CustomEvent("favoritesUpdated", {
            detail: { id, favorites: updated }
        })
    );

    return updated.includes(id);
}

/* CART PAGE URL */

function getCartUrl() {
    return new URL("../cart/index.html", import.meta.url).href;
    }

/* UPDATE CART BADGE */

function updateCartBadge() {
    if (!cartBadge) {
        return;
    }

    const count = cartCount();

    cartBadge.textContent = count;
    cartBadge.hidden = count === 0;
}

/* CREATE FAST CART */

function createFastCart() {
    document.body.insertAdjacentHTML("beforeend", `
        <div class="fast-cart-overlay"></div>

        <aside
            class="fast-cart"
            id="fast-cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            aria-hidden="true"
            tabindex="-1"
            inert
        >

            <div class="fast-cart-header">
                <h2>Your Cart</h2>

                <button class="fast-cart-close" type="button" aria-label="Close cart">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>

            <div class="fast-cart-content">
                <div class="fast-cart-items" aria-live="polite"></div>
            </div>

            <div class="fast-cart-footer">
                <div class="fast-cart-subtotal">
                    <span>Subtotal</span>
                    <span id="fast-cart-subtotal">$0.00</span>
                </div>

                <p class="fast-cart-shipping">
                Shipping calculated at checkout
                </p>

                <a class="fast-cart-view-cart" href="${getCartUrl()}">
                View Cart </a>

                <button class="fast-cart-continue" type="button">
                Continue Shopping
                </button>
            </div>
        </aside>
    `);

    overlay = document.querySelector(".fast-cart-overlay");
    fastCart = document.querySelector(".fast-cart");
    cartItems = document.querySelector(".fast-cart-items");
    cartSubtotal = document.getElementById("fast-cart-subtotal");
    closeButton = document.querySelector(".fast-cart-close");
}

/* INITIALIZE FAST CART */

export function initFastCart() {
    cartButton = document.getElementById("cart-btn");
    cartBadge = document.getElementById("cart-count");

    if (!cartButton) {
        return;
    }

    if (document.getElementById("fast-cart-panel")) {
        return;
    }

    createFastCart();

    cartButton.setAttribute("aria-controls", "fast-cart-panel");
    cartButton.setAttribute("aria-expanded", "false");

    cartButton.addEventListener("click", openFastCart);
    closeButton.addEventListener("click", closeFastCart);

    document
        .querySelector(".fast-cart-continue")
        .addEventListener("click", closeFastCart);

    overlay.addEventListener("click", closeFastCart);

    cartItems.addEventListener("click", handleCartClick);

    document.addEventListener("keydown", handleKeyboard);

    window.addEventListener("cartUpdated", handleCartUpdate);

    window.addEventListener("storage", (event) => {
        if (
            event.key === "vario_cart_v1" ||
            event.key === null
        ) {
            handleCartUpdate();
        }

        if (event.key === getFavoritesKey() || event.key === null) { 
            updateFavoriteIcons();
        }
    });

    window.addEventListener("favoritesUpdated", updateFavoriteIcons);

    updateCartBadge();
}

/* OPEN FAST CART */

export function openFastCart() {
    if (!fastCart || !overlay) {
        return;
    }

    if (fastCart.classList.contains("active")) {
        return;
    }

    previousFocus = document.activeElement;

    fastCart.inert = false;
    fastCart.setAttribute("aria-hidden", "false");

    fastCart.classList.add("active");
    overlay.classList.add("active");

    cartButton.setAttribute("aria-expanded", "true");

    document.body.style.overflow = "hidden";

    closeButton.focus();

    renderFastCart();
}

/* CLOSE FAST CART */

export function closeFastCart() {
    if (!fastCart || !overlay) {
        return;
    }

    if (!fastCart.classList.contains("active")) {
        return;
    }

    renderVersion++;

    fastCart.classList.remove("active");
    overlay.classList.remove("active");

    cartButton.setAttribute("aria-expanded", "false");

    document.body.style.overflow = "";

    if (previousFocus?.isConnected) {
        previousFocus.focus();
    }

    fastCart.inert = true;
    fastCart.setAttribute("aria-hidden", "true");

    previousFocus = null;
}

/* HANDLE KEYBOARD */

function handleKeyboard(event) {
    if (!fastCart?.classList.contains("active")) {
        return;
    }

    if (event.key === "Escape") {
        closeFastCart();
        return;
    }

    if (event.key === "Tab") {
        const focusable = [
            ...fastCart.querySelectorAll(
                'button:not([disabled]), a[href]'
            )
        ].filter((element) => element.getClientRects().length > 0);

        if (focusable.length === 0) {
            event.preventDefault();
            fastCart.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    }
}

/* HANDLE CART UPDATES */

function handleCartUpdate() {
    updateCartBadge();

    if (fastCart?.classList.contains("active")) {
        renderFastCart();
    }
}

/* UPDATE FAVORITE ICONS */

function updateFavoriteIcons() {
    if (!cartItems) {
        return;
    }

    const favorites = getFavorites ();

    cartItems
    .querySelectorAll(".fast-cart-favorite")
    .forEach((button) => {
        const item = button.closest(".fast-cart-item");

        if (!item) {
            return;
        }

        const saved = favorites.includes(item.dataset.id);
        const icon = button.querySelector("i");

        button.setAttribute("aria-pressed", String(saved));
        button.setAttribute("aria-label", saved ? "Remove from favorites" : "Add to favorites");

        if (icon) {
            icon.className = saved ? "fa-solid fa-heart" : "fa-regular fa-heart";
        }
    });
}

/* CREATE PRODUCT ELEMENT */

function createProductElement(product) {
    const item = document.createElement("div");
    item.className = "fast-cart-item";
    item.dataset.id = product.id;

    const image = document.createElement("img");
    image.className = "fast-cart-item-image";
    image.src = product.image?.url || "";
    image.alt = product.image?.alt || product.title;

    const details = document.createElement("div");
    details.className = "fast-cart-item-details";

    const title = document.createElement("h3");
    title.className = "fast-cart-item-title";
    title.textContent = product.title;

    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "fast-cart-favorite";

    const favoriteIcon = document.createElement("i");
    favoriteIcon.setAttribute("aria-hidden", "true");

    const saved = isFavorite(product.id);

    favoriteIcon.className = saved ? "fa-solid fa-heart" : "fa-regular fa-heart";

    favoriteButton.setAttribute("aria-pressed", String(saved));
    favoriteButton.setAttribute("aria-label", saved ? "Remove from favorites" : "Add to favorites");

    favoriteButton.appendChild(favoriteIcon);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "fast-cart-remove";
    removeButton.setAttribute("aria-label", `Remove ${product.title} from cart`);

    const removeIcon = document.createElement("i");
    removeIcon.className = "fa-regular fa-trash-can";
    removeIcon.setAttribute("aria-hidden", "true");

    removeButton.appendChild(removeIcon);

    const titleRow = document.createElement("div");
    titleRow.className = "fast-cart-item-top";

    const itemActions = document.createElement("div");
    itemActions.className = "fast-cart-item-actions";

    itemActions.append(favoriteButton, removeButton);
    titleRow.append(title, itemActions);

    const price = document.createElement("p");
    price.className = "fast-cart-item-price";

    const currentPrice = product.discountedPrice ?? product.price;
    price.textContent = formatPrice(currentPrice);

    const quantity = document.createElement("div");
    quantity.className = "fast-cart-quantity";

    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.className = "decrease-qty";
    decreaseButton.textContent = "-";
    decreaseButton.setAttribute("aria-label", "Decrease quantity");

    const quantityText = document.createElement("span");
    quantityText.textContent = product.qty;

    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.className = "increase-qty";
    increaseButton.textContent = "+";
    increaseButton.setAttribute("aria-label", "Increase quantity");

    quantity.append(
        decreaseButton,
        quantityText,
        increaseButton
    );

    details.append(
        titleRow,
        price,
        quantity
    );

    item.append(image, details);

    return item;
}

/* RENDER FAST CART */

async function renderFastCart() {
    if (!cartItems || !cartSubtotal) {
        return;
    }

    const currentRender = ++renderVersion;
    const cart = getCart();

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="fast-cart-empty">
                <p>Your cart is empty.</p>
            </div>
        `;

        cartSubtotal.textContent = formatPrice(0);
        return;
    }

    cartItems.textContent = "Loading your cart...";

    try {
        
        const products = await Promise.all(
            cart.map(async (item) => {
                const product = await fetchOne(item.id);

                if (!product) {
                    throw new Error("Product not found");
                }

                return {
                    ...product,
                    qty: item.qty
                };
            })
        );

        
        if (currentRender !== renderVersion) {
            return;
        }

        cartItems.replaceChildren();

        let subtotal = 0;

        products.forEach((product) => {
            const price = product.discountedPrice ?? product.price;

            subtotal += price * product.qty;

            cartItems.appendChild(
                createProductElement(product)
            );
        });

        cartSubtotal.textContent = formatPrice(subtotal);

    } catch (error) {
        if (currentRender !== renderVersion) {
            return;
        }

        console.error("Fast cart error:", error);

        cartItems.textContent =
            "Unable to load your cart. Please try again.";

        cartSubtotal.textContent = "—";
    }
}

/* CART BUTTONS */

function handleCartClick(event) {
    const button = event.target.closest("button");
    const cartItem = event.target.closest(".fast-cart-item");

    if (!button || !cartItem) {
        return;
    }

    const id = cartItem.dataset.id;

    if (button.classList.contains("fast-cart-favorite")) {
        if (!isLoggedIn() || !getCurrentUser()?.email) {
            const returnUrl = 
            window.location.pathname + window.location.search + window.location.hash;

            window.location.href = new URL(`../account/login.html?redirect=${encodeURIComponent(returnUrl)}`,
        import.meta.url).href;
        return;
        }

        toggleFavorite(id);
        updateFavoriteIcons();
        return;
    }

    if (button.classList.contains("fast-cart-remove")) {
        removeFromCart(id);
        handleCartUpdate();
        return;
    }

    const cart = getCart();

    const item = cart.find(
        (product) => product.id === id
    );

    if (!item) {
        return;
    }

    if (button.classList.contains("increase-qty")) {
        updateQuantity(id, item.qty + 1);
    }

    if (button.classList.contains("decrease-qty")) {
        updateQuantity(id, item.qty - 1);
    }
}
