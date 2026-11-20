import { fetchAll } from "./shared/api.js";
import { addToCart } from "./shared/cart-storage.js";
import { initFastCart, openFastCart } from "./shared/fast-cart.js";
import { isLoggedIn, getCurrentUser } from "./shared/auth.js";

const carouselContent = document.getElementById("carousel-content");
const carouselDots = document.getElementById("carousel-dots");
const prevButton = document.getElementById("prev-btn");
const nextButton = document.getElementById("next-btn");
const newProductsGrid = document.getElementById("new-products-grid");
const favoritesGrid = document.getElementById("favorites-grid");
const categoriesNav = document.getElementById("categories");
const categoriesButton = document.getElementById("categories-btn");
const footerCategories = document.getElementById("footer-categories");
const searchForm = document.querySelector(".search-form");

const FAVORITES_KEY_PREFIX = "vario_favorites_v1";

let allProducts = [];
let currentSlide = 0;

function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(price);
}

function getProductPrice(product) {
    return product.discountedPrice ?? product.price;
}

function getProductUrl(id) {
    return `./product/index.html?id=${encodeURIComponent(id)}`;
}

function setMessage(element, message) {
    if (element) {
        element.textContent = message;
    }
}

function createPriceElement(product) {
    const container = document.createElement("div");
    container.className = "product-price";

    const currentPrice = getProductPrice(product);

    if (currentPrice < product.price) {
        const discounted = document.createElement("span");
        discounted.className = "discounted-price";
        discounted.textContent = formatPrice(currentPrice);

        const original = document.createElement("span");
        original.className = "original-price";
        original.textContent = formatPrice(product.price);

        container.append(discounted, original);
    } else {
        container.textContent = formatPrice(currentPrice);
    }

    return container;
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

function toggleFavorite(id) {
    const key = getFavoritesKey();

    if (!key) return;

    const favorites = getFavorites();

    const updated = favorites.includes(id) ? favorites.filter((favoriteId) => favoriteId !== id) : [...favorites, id];

    localStorage.setItem(key, JSON.stringify(updated));

    window.dispatchEvent(new Event("favoritesUpdated"));
}

/* FAVORITE BUTTONS */

function updateFavoriteButtons() {
    const favorites = getFavorites();

    document.querySelectorAll(".product-card").forEach(card => {
        const button = card.querySelector(".favorite-btn");
        const icon = button?.querySelector("i");
        const id = card.dataset.productId;

        if (!button || !icon || !id) return;

        const selected = favorites.includes(id);

        icon.className = selected
            ? "fa-solid fa-heart"
            : "fa-regular fa-heart";

        button.setAttribute(
            "aria-label",
            selected ? "Remove from favorites" : "Add to favorites"
        );

        button.setAttribute("aria-pressed", String(selected));
    });
}

window.addEventListener("favoritesUpdated", updateFavoriteButtons);

/* PRODUCT CARDS */

function createProductCard(product, showRating = true) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.productId = product.id;

    const imageLink = document.createElement("a");
    imageLink.className = "product-image";
    imageLink.href = getProductUrl(product.id);

    const image = document.createElement("img");
    image.src = product.image?.url || "";
    image.alt = product.image?.alt || product.title;
    image.loading = "lazy";

    imageLink.appendChild(image);

    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "favorite-btn";

    const favoriteIcon = document.createElement("i");
    favoriteIcon.setAttribute("aria-hidden", "true");

    favoriteButton.appendChild(favoriteIcon);

    favoriteButton.addEventListener("click", () => {
        if (!isLoggedIn() || !getCurrentUser()?.email) {
            const returnUrl =
            window.location.pathname +
            window.location.search +
            window.location.hash;

            window.location.href = 
            `./account/login.html?redirect=${encodeURIComponent(returnUrl)}`;
            return;
        }

        toggleFavorite(product.id);
        });

    const info = document.createElement("div");
    info.className = "product-info";

    const infoRow = document.createElement("div");
    infoRow.className = "product-info-row";

    const title = document.createElement("h3");

    const titleLink = document.createElement("a");
    titleLink.href = getProductUrl(product.id);
    titleLink.textContent = product.title;

    title.appendChild(titleLink);
    infoRow.appendChild(title);

    if (showRating && product.rating != null) {
        const rating = document.createElement("span");
        rating.className = "product-rating";
        rating.textContent = `★ ${product.rating}`;

        rating.setAttribute(
            "aria-label",
            `Rated ${product.rating} out of 5`
        );

        infoRow.appendChild(rating);
    }

    const price = createPriceElement(product);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-to-cart-btn";
    addButton.textContent = "Add to Cart";

    addButton.addEventListener("click", () => {
        if (!isLoggedIn()) {
            const returnUrl =
                window.location.pathname +
                window.location.search +
                window.location.hash;

            window.location.href =
                `./account/login.html?redirect=${encodeURIComponent(returnUrl)}`;

            return;
        }

        addToCart(product.id, 1);
        openFastCart();
    });

    info.append(infoRow, price, addButton);
    card.append(imageLink, favoriteButton, info);

    return card;
}

/* RENDER PRODUCT GRIDS */

function renderProducts(products, container, showRating = true) {
    if (!container) return;

    container.replaceChildren();

    if (products.length === 0) {
        setMessage(container, "No products available.");
        return;
    }

    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        fragment.appendChild(
            createProductCard(product, showRating)
        );
    });

    container.appendChild(fragment);
    updateFavoriteButtons();
}

/* NEW IN STORE & FAVORITES */

function renderNewProducts() {
    const products = allProducts.slice(-3).reverse();

    renderProducts(products, newProductsGrid, false);
}

function renderFavorites() {
    const products = [...allProducts]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 12);

    renderProducts(products, favoritesGrid, true);
}

/* CATEGORIES */

function getCategories() {
    const tags = allProducts.flatMap(
        product => product.tags || []
    );

    return [...new Set(tags)].sort((a, b) =>
        a.localeCompare(b)
    );
}

function createCategoryLink(category) {
    const link = document.createElement("a");

    link.href =
        `./products/index.html?category=${encodeURIComponent(category)}`;

    link.textContent = category;

    return link;
}

function renderCategories() {
    const categories = getCategories();

    if (categoriesNav) {
        categoriesNav.replaceChildren();

        categories.forEach(category => {
            categoriesNav.appendChild(
                createCategoryLink(category)
            );
        });
    }

    if (footerCategories) {
        footerCategories.replaceChildren();

        categories.slice(0, 6).forEach(category => {
            footerCategories.appendChild(
                createCategoryLink(category)
            );
        });
    }
}

/* CATEGORIES DROPDOWN */

function closeCategories() {
    if (!categoriesButton || !categoriesNav) return;

    categoriesNav.hidden = true;
    categoriesButton.setAttribute("aria-expanded", "false");
}

categoriesButton?.addEventListener("click", () => {
    if (!categoriesNav) return;

    const isOpen =
        categoriesButton.getAttribute("aria-expanded") === "true";

    categoriesNav.hidden = isOpen;

    categoriesButton.setAttribute(
        "aria-expanded",
        String(!isOpen)
    );
});

document.addEventListener("click", event => {
    if (!event.target.closest(".categories-dropdown")) {
        closeCategories();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCategories();
    }
});

categoriesNav?.addEventListener("click", event => {
    if (event.target.closest("a")) {
        closeCategories();
    }
});

/* HERO CAROUSEL */

function renderCarousel() {
    if (!carouselContent || !carouselDots) return;

    const products = allProducts
        .filter(product => product.image?.url)
        .slice(0, 3);

    carouselContent.replaceChildren();
    carouselDots.replaceChildren();

    products.forEach((product, index) => {
        const slide = document.createElement("div");
        slide.className = "carousel-slide";

        const content = document.createElement("div");
        content.className = "carousel-content";

        const title = document.createElement("h2");
        title.textContent = product.title;

        const price = createPriceElement(product);
        price.classList.add("carousel-price");

        const shopLink = document.createElement("a");
        shopLink.className = "primary-button";
        shopLink.href = getProductUrl(product.id);
        shopLink.textContent = "Shop This Product →";

        content.append(title, price, shopLink);

        const imageContainer = document.createElement("div");
        imageContainer.className = "carousel-image";

        const image = document.createElement("img");
        image.src = product.image.url;
        image.alt = product.image.alt || product.title;

        imageContainer.appendChild(image);

        slide.append(content, imageContainer);
        carouselContent.appendChild(slide);

        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";

        dot.setAttribute(
            "aria-label",
            `Go to slide ${index + 1}`
        );

        dot.addEventListener("click", () => {
            showSlide(index);
        });

        carouselDots.appendChild(dot);
    });

    showSlide(0);
}

function showSlide(index) {
    const slides = carouselContent?.querySelectorAll(".carousel-slide");
    const dots = carouselDots?.querySelectorAll(".carousel-dot");

    if (!slides?.length) return;

    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
        const active = slideIndex === currentSlide;

        slide.classList.toggle("active", active);
        slide.setAttribute("aria-hidden", String(!active));
        slide.inert = !active;
    });

    dots?.forEach((dot, dotIndex) => {
        const active = dotIndex === currentSlide;

        dot.classList.toggle("active", active);

        if (active) {
            dot.setAttribute("aria-current", "true");
        } else {
            dot.removeAttribute("aria-current");
        }
    });
}

prevButton?.addEventListener("click", () => {
    showSlide(currentSlide - 1);
});

nextButton?.addEventListener("click", () => {
    showSlide(currentSlide + 1);
});

/* SEARCH */

searchForm?.addEventListener("submit", event => {
    event.preventDefault();

    const query = searchForm
        .querySelector('input[name="search"]')
        ?.value.trim();

    if (!query) return;

    window.location.href =
        `./products/index.html?search=${encodeURIComponent(query)}`;
});

/* ACCOUNT LINK */

function updateAccountLink() {
    const loggedIn = isLoggedIn();

    const accountLinks = [
        document.getElementById("account-link"),
        document.getElementById("footer-account-link")
    ];

    accountLinks.forEach(link => {
        if (!link) return;

        link.href = loggedIn
            ? "./account/index.html"
            : "./account/login.html";

        const label = loggedIn ? "My Account" : "Log in";

        link.setAttribute("aria-label", label);

        const text = link.querySelector("span");

        if (text) {
            text.textContent = label;
        } else if (link.id === "footer-account-link") {
            link.textContent = label;
        }
    });
}

/* INITIALIZE HOMEPAGE */

async function initHomepage() {
    initFastCart();
    updateAccountLink();

    setMessage(newProductsGrid, "Loading products...");
    setMessage(favoritesGrid, "Loading products...");
    setMessage(carouselContent, "Loading featured products...");

    try {
        allProducts = await fetchAll();

        renderCategories();
        renderCarousel();
        renderNewProducts();
        renderFavorites();

    } catch (error) {
        console.error("Unable to load homepage:", error);

        setMessage(
            newProductsGrid,
            "Unable to load products. Please try again."
        );

        setMessage(
            favoritesGrid,
            "Unable to load products. Please try again."
        );

        setMessage(
            carouselContent,
            "Unable to load featured products."
        );
    }
}

initHomepage();
