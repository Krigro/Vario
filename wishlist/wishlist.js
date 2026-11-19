
import { fetchAll } from "../shared/api.js";
import { addToCart } from "../shared/cart-storage.js";
import { initFastCart, openFastCart } from "../shared/fast-cart.js";
import { isLoggedIn } from "../shared/auth.js";

const productsGrid = document.getElementById("products-grid");
const productsMessage = document.getElementById("products-message");
const categoriesNav = document.getElementById("categories");
const footerCategories = document.getElementById("footer-categories");
const categoriesButton = document.getElementById("categories-btn");
const backToTop = document.querySelector(".back-to-top");

const FAVORITES_KEY = "vario_favorites_v1";
let allProducts = [];

/* PRICE */

function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(price);
}

function getProductPrice(product) {
    return product.discountedPrice ?? product.price;
}

/* FAVORITES */

function getFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY));
        return Array.isArray(favorites) ? favorites : [];
    } catch {
        return [];
    }
}

function removeFavorite(id) {
    const updated = getFavorites().filter((favoriteId) => favoriteId !== id);

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

    renderWishlist();
}

/* PRODUCT CARD */

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageLink = document.createElement("a");
    imageLink.className = "product-image";
    imageLink.href = `../product/index.html?id=${encodeURIComponent(product.id)}`;

    const image = document.createElement("img");
    image.src = product.image?.url || "";
    image.alt = product.image?.alt || product.title;
    image.loading = "lazy";

    imageLink.appendChild(image);

    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "favorite-btn";
    favoriteButton.setAttribute("aria-label", `Remove ${product.title} from wishlist`);
    favoriteButton.setAttribute("aria-pressed", "true");

    const favoriteIcon = document.createElement("i");
    favoriteIcon.className = "fa-solid fa-heart";
    favoriteIcon.setAttribute("aria-hidden", "true");

    favoriteButton.appendChild(favoriteIcon);

    favoriteButton.addEventListener("click", () => {
        removeFavorite(product.id);
    });

    const info = document.createElement("div");
    info.className = "product-info";

    const title = document.createElement("h3");
    const titleLink = document.createElement("a");
    titleLink.href = imageLink.href;
    titleLink.textContent = product.title;

    title.appendChild(titleLink);

    const rating = document.createElement("div");
    rating.className = "product-rating";

    const ratingValue = Number(product.rating) || 0;
    const roundedRating = Math.round(ratingValue);

    const stars = document.createElement("span");
    stars.className = "rating-stars";
    stars.setAttribute("aria-hidden", "true");

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("i");

        star.className = i <= roundedRating
            ? "fa-solid fa-star"
            : "fa-regular fa-star";

        stars.appendChild(star);
    }

    const ratingText = document.createElement("span");
    ratingText.className = "rating-value";
    ratingText.textContent = ratingValue.toFixed(1);

    rating.setAttribute(
        "aria-label",
        `Rated ${ratingValue.toFixed(1)} out of 5 stars`
    );

    rating.append(stars, ratingText);

    const priceContainer = document.createElement("div");
    priceContainer.className = "product-price";

    const price = getProductPrice(product);

    if (price < product.price) {
        const originalPrice = document.createElement("span");
        originalPrice.className = "original-price";
        originalPrice.textContent = formatPrice(product.price);

        const discountedPrice = document.createElement("span");
        discountedPrice.className = "discounted-price";
        discountedPrice.textContent = formatPrice(price);

        priceContainer.append(originalPrice, discountedPrice);
    } else {
        priceContainer.textContent = formatPrice(price);
    }

    const addButton = document.createElement("button");
    addButton.className = "add-to-cart-btn";
    addButton.type = "button";
    addButton.textContent = "Add to Cart";

    addButton.addEventListener("click", () => {
        if (!isLoggedIn()) {
            const returnUrl =
                window.location.pathname + window.location.search;

            window.location.href =
                `../account/login.html?redirect=${encodeURIComponent(returnUrl)}`;

            return;
        }

        addToCart(product.id, 1);
        openFastCart();
    });

    info.append(title, rating, priceContainer, addButton);
    card.append(imageLink, favoriteButton, info);

    return card;
}

/* WISHLIST */

function renderWishlist() {
    if (!productsGrid || !productsMessage) return;

    const favorites = getFavorites();

    const favoriteProducts = favorites
        .map((id) => allProducts.find((product) => product.id === id))
        .filter(Boolean);

    productsGrid.replaceChildren();
    productsMessage.replaceChildren();

    if (backToTop) {
        backToTop.hidden = favoriteProducts.length === 0;
    }

    if (favorites.length === 0) {
        const message = document.createElement("p");
        message.textContent = "Your wishlist is empty.";

        const shopLink = document.createElement("a");
        shopLink.href = "../products/index.html";
        shopLink.textContent = "Shop Products";

        productsMessage.append(message, shopLink);
        return;
    }

    if (favoriteProducts.length === 0) {
        productsMessage.textContent =
            "Your saved products are currently unavailable.";
        return;
    }

    favoriteProducts.forEach((product) => {
        productsGrid.appendChild(createProductCard(product));
    });
}

/* CATEGORIES */

function renderCategories() {
    const categories = [
        ...new Set(
            allProducts.flatMap((product) => product.tags || [])
        )
    ].sort((a, b) => a.localeCompare(b));

    function createCategoryLink(category) {
        const link = document.createElement("a");
        link.href =
            `../products/index.html?category=${encodeURIComponent(category)}`;
        link.textContent = category;
        return link;
    }

    if (categoriesNav) {
        categoriesNav.replaceChildren();

        categories.forEach((category) => {
            categoriesNav.appendChild(createCategoryLink(category));
        });
    }

    if (footerCategories) {
        footerCategories.replaceChildren();

        categories.slice(0, 8).forEach((category) => {
            footerCategories.appendChild(createCategoryLink(category));
        });
    }
}

/* CATEGORIES DROPDOWN */

function closeCategoriesMenu() {
    if (!categoriesButton || !categoriesNav) return;

    categoriesNav.hidden = true;
    categoriesButton.setAttribute("aria-expanded", "false");
}

categoriesButton?.addEventListener("click", () => {
    const isOpen =
        categoriesButton.getAttribute("aria-expanded") === "true";

    categoriesNav.hidden = isOpen;
    categoriesButton.setAttribute("aria-expanded", String(!isOpen));
});

document.addEventListener("click", (event) => {
    if (!event.target.closest(".categories-dropdown")) {
        closeCategoriesMenu();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeCategoriesMenu();
    }
});

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
            accountText.textContent = loggedIn
                ? "My account"
                : "Log in";
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

/* INITIALIZE */

async function initWishlist() {
    initFastCart();
    updateAccountLink();

    if (productsMessage) {
        productsMessage.textContent = "Loading your wishlist...";
    }

    try {
        allProducts = await fetchAll();

        renderCategories();
        renderWishlist();

    } catch (error) {
        console.error("Unable to load wishlist:", error);

        if (productsMessage) {
            productsMessage.textContent =
                "Unable to load your wishlist. Please try again.";
        }
    }
}

window.addEventListener("storage", (event) => {
    if (event.key === FAVORITES_KEY) {
        renderWishlist();
    }
});

window.addEventListener("pageshow", () => {
    if (allProducts.length > 0) {
        renderWishlist();
    }
});

initWishlist();
