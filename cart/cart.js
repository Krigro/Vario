import { fetchAll, fetchOne } from "../shared/api.js";
import { isLoggedIn } from "../shared/auth.js";

import {
    getCart,
    updateQuantity,
    removeFromCart,
} from "../shared/cart-storage.js";

/* ELEMENTS */

const cartItems = document.getElementById("cart-items");
const cartMessage = document.getElementById("cart-message");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartTotal = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-btn");
const clearCartButton = document.getElementById("clear-cart");
const cartItemCount = document.getElementById("cart-item-count");
const cartShipping = document.getElementById("cart-shipping");

const FAVORITES_KEY = "vario_favorites_v1";

let renderVersion = 0;

/* FORMAT PRICE */

function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(price);
}

/* PRODUCT PRICE */

function getProductPrice(product) {
    return product.discountedPrice ?? product.price;
}

/* FAVORITES */
function getFavorites() {
    try {
        const favorites = JSON.parse(
            localStorage.getItem(FAVORITES_KEY)
        );

        return Array.isArray(favorites) ? favorites : [];
    } catch {
        return [];
    }
    }

    function toggleFavorite(id) {
        const favorites = getFavorites();

        const updated = favorites.includes(id) ? favorites.filter((favoriteId) => favoriteId !== id) : [...favorites, id];

        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }

/* ACCOUNT LINK */

function updateAccountLink() {
    const accountLink = document.getElementById("account-link");
    const footerAccountLink = document.getElementById("footer-account-link");

    const loggedIn = isLoggedIn();

    if (accountLink) {
        accountLink.href = loggedIn
            ? "../account/index.html"
            : "../account/login.html";

        accountLink.setAttribute(
            "aria-label",
            loggedIn ? "My account" : "Log in"
        );

        const accountText = accountLink.querySelector("span");

        if (accountText) {
            accountText.textContent = loggedIn ? "My Account" : "Log in";
        }
    }

    if (footerAccountLink) {
        footerAccountLink.href = loggedIn
            ? "../account/index.html"
            : "../account/login.html";

        footerAccountLink.textContent = loggedIn
            ? "My Account"
            : "Log In";
    }
}

/* FOOTER CATEGORIES */

async function loadFooterCategories() {
    const footerCategories = document.getElementById("footer-categories");

    if (!footerCategories) return;

    try {
        const products = await fetchAll();

        const categories = [
            ...new Set(
                products.flatMap((product) => product.tags || [])
            )
        ]
            .sort((a, b) => a.localeCompare(b))
            .slice(0, 8);

        footerCategories.replaceChildren();

        categories.forEach((category) => {
            const link = document.createElement("a");

            link.href =
                `../products/index.html?category=${encodeURIComponent(category)}`;

            link.textContent = category;

            footerCategories.appendChild(link);
        });

    } catch (error) {
        console.error("Unable to load footer categories:", error);
    }
}


/* UPDATE CART COUNT */

function updateCartItemCount(items) {
    if (!cartItemCount) return;

    const totalItems = items.reduce(
        (total, item) => total + item.qty,
         0
        );

    cartItemCount.textContent =
     `${totalItems} ${totalItems === 1 ? "item" : "items"}`;
}


/* CHECKOUT STATE */

function updateCheckoutState(enabled) {
    if (!checkoutButton) return;

    checkoutButton.setAttribute("aria-disabled", String(!enabled));

    checkoutButton.tabIndex = enabled ? 0 : -1;
}

/* CREATE CART ITEM */

function createCartItem(product, quantity) {
    const item = document.createElement("article");
    item.className = "cart-item";

    // Product image
    const imageLink = document.createElement("a");
    imageLink.className = "cart-item-image";
    imageLink.href = `../product/index.html?id=${encodeURIComponent(product.id)}`;

    const image = document.createElement("img");
    image.src = product.image?.url || "";
    image.alt = product.image?.alt || product.title;
    image.loading = "lazy";

    imageLink.appendChild(image);

    // Product details
    const details = document.createElement("div");
    details.className = "cart-item-details";

    const title = document.createElement("a");
    title.className = "cart-item-title";
    title.href = imageLink.href;
    title.textContent = product.title;

    const price = document.createElement("p");
    price.className = "cart-item-price";
    price.textContent = formatPrice(getProductPrice(product));

    details.append(title, price);

    // Quantity controls
    const quantityContainer = document.createElement("div");
    quantityContainer.className = "cart-item-quantity";

    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.textContent = "-";
    decreaseButton.setAttribute("aria-label", `Decrease quantity of ${product.title}`);

    const quantityValue = document.createElement("span");
    quantityValue.textContent = quantity;

    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.textContent = "+";
    increaseButton.setAttribute("aria-label", `Increase quantity of ${product.title}`);

    decreaseButton.addEventListener("click", () => {
        updateQuantity(product.id, quantity - 1);
        renderCart();
    });

    increaseButton.addEventListener("click", () => {
        updateQuantity(product.id, quantity + 1);
        renderCart();
    });

    quantityContainer.append(
        decreaseButton,
        quantityValue,
        increaseButton
    );

    // Item total
    const itemTotal = document.createElement("p");
    itemTotal.className = "cart-item-total";
    itemTotal.textContent = formatPrice(getProductPrice(product) * quantity);

    // Product actions

    const actions = document.createElement("div");
    actions.className = "cart-item-actions";

    // Remove button
    const removeButton = document.createElement("button");
    removeButton.className = "cart-item-remove";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove ${product.title} from cart`);

    const removeIcon = document.createElement("i");
    removeIcon.className = "fa-regular fa-trash-can";
    removeIcon.setAttribute("aria-hidden", "true");

    removeButton.appendChild(removeIcon);

    removeButton.addEventListener("click", () => {
        removeFromCart(product.id);
        renderCart();
    });

    // Favorite button
    const favoriteButton = document.createElement("button");
    favoriteButton.className = "cart-item-favorite";
    favoriteButton.type = "button";

    const favoriteIcon = document.createElement("i");
    favoriteIcon.setAttribute("aria-hidden", "true");

    favoriteButton.appendChild(favoriteIcon);

    function updateFavoriteButton() {
        const isFavorite = getFavorites().includes(product.id);

        favoriteIcon.className = isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart";

        favoriteButton.setAttribute("aria-pressed", String(isFavorite));
        favoriteButton.setAttribute("aria-label", isFavorite ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`);
    }

    favoriteButton.addEventListener("click", () => {
        toggleFavorite(product.id);
        updateFavoriteButton();
    });

    updateFavoriteButton();
    actions.append(removeButton, favoriteButton);

    item.append(
        imageLink,
        details,
        quantityContainer,
        itemTotal,
        actions
    );

    return item;
}

/* UPDATE TOTALS */

function updateTotals(subtotal) {
    const shipping = 0;
    const total = subtotal + shipping;

    if (cartSubtotal) {
        cartSubtotal.textContent = formatPrice(subtotal);
    }

    if (cartShipping) {
        cartShipping.textContent = formatPrice(shipping);
    }

    if (cartTotal) {
        cartTotal.textContent = formatPrice(total);
    }
}

/* RENDER CART */

async function renderCart() {
    const currentVersion = ++renderVersion;
    const items = getCart();

    updateCartItemCount(items);

    if (cartItems) {
        cartItems.replaceChildren();
    }

    updateTotals(0);
    updateCheckoutState(false);

    if (clearCartButton) {
        clearCartButton.disabled = items.length === 0;
    }

    if (items.length === 0) {
        if (cartMessage) {
            cartMessage.textContent = "Your cart is empty.";
        }

        return;
    }

    if (cartMessage) {
        cartMessage.textContent = "Loading your cart...";
    }

    try {
        const products = await Promise.all(
            items.map(async (item) => {
                const product = await fetchOne(item.id);

                return {
                    product,
                    quantity: item.qty
                };
            })
        );

        if (currentVersion !== renderVersion) {
            return;
        }

        let subtotal = 0;

        products.forEach(({ product, quantity }) => {
            if (!product) return;

            subtotal += getProductPrice(product) * quantity;

            if (cartItems) {
                cartItems.appendChild(
                    createCartItem(product, quantity)
                );
            }
        });

        updateTotals(subtotal);

        if (cartMessage) {
            cartMessage.textContent = "";
        }

        updateCheckoutState(subtotal > 0);

    } catch (error) {
        if (currentVersion !== renderVersion) {
            return;
        }

        console.error("Unable to load cart:", error);

        if (cartMessage) {
            cartMessage.textContent =
                "Unable to load your cart. Please try again.";
        }
    }
}

/* CLEAR CART */

clearCartButton?.addEventListener("click", () => {
    const items = getCart();

    if (items.length === 0) return;

    items.forEach((item) => {
        removeFromCart(item.id);
    });

    renderCart();
});

/* CHECKOUT */

checkoutButton?.addEventListener("click", (event) => {
    if (
        checkoutButton.getAttribute("aria-disabled") === "true" ||
        getCart().length === 0
    ) {
        event.preventDefault();
    }
});

/* CART EVENTS */

window.addEventListener("cartUpdated", renderCart);

window.addEventListener("authUpdated", updateAccountLink);

window.addEventListener("storage", (event) => {
    if (event.key === "vario_cart_v1") {
        renderCart();
    }

    if (
        event.key === "vario_access_token" ||
        event.key === "vario_user"
    ) {
        updateAccountLink();
    }
});

/* INITIALIZE CART */

updateAccountLink();
renderCart();
loadFooterCategories();
