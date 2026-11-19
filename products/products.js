import { fetchAll } from "../shared/api.js";
import { addToCart } from "../shared/cart-storage.js";
import { initFastCart, openFastCart } from "../shared/fast-cart.js";
import { isLoggedIn } from "../shared/auth.js";

/* ELEMENTS */

const productsGrid = document.getElementById("products-grid");
const productsMessage = document.getElementById("products-message");
const categoryFilter = document.getElementById("category-filter");
const sortOrder = document.getElementById("sort-order");
const searchForm = document.querySelector(".search-form");
const categoriesNav = document.getElementById("categories");
const footerCategories = document.getElementById("footer-categories");

let allProducts = [];

const params = new URLSearchParams(window.location.search);
const initialCategory = params.get("category") || "all";
const initialSearch = params.get("search") || "";

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

const FAVORITES_KEY = "vario_favorites_v1";

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

    const updated = favorites.includes(id)
        ? favorites.filter((favoriteId) => favoriteId !== id)
        : [...favorites, id];

    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(updated)
    );
}

/* PRODUCT CARD */

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageLink = document.createElement("a");
    imageLink.className = "product-image";
    imageLink.href =
        `../product/index.html?id=${encodeURIComponent(product.id)}`;

    const image = document.createElement("img");
    image.src = product.image?.url || "";
    image.alt = product.image?.alt || product.title;
    image.loading = "lazy";

    imageLink.appendChild(image);

    // Favorite button
    const favoriteButton = document.createElement("button");
    favoriteButton.className = "favorite-btn";
    favoriteButton.type = "button";

    const favoriteIcon = document.createElement("i");
    favoriteIcon.setAttribute("aria-hidden", "true");

    favoriteButton.appendChild(favoriteIcon);

    function updateFavoriteButton() {
        const isFavorite = getFavorites().includes(product.id);

        favoriteIcon.className = isFavorite
            ? "fa-solid fa-heart"
            : "fa-regular fa-heart";

        favoriteButton.setAttribute(
            "aria-label",
            isFavorite
                ? "Remove from wishlist"
                : "Add to wishlist"
        );

        favoriteButton.setAttribute(
            "aria-pressed",
            String(isFavorite)
        );
    }

    updateFavoriteButton();

    favoriteButton.addEventListener("click", () => {
        toggleFavorite(product.id);
        updateFavoriteButton();
    });

    // Product information
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

        star.className = i <= roundedRating ? "fa-solid fa-star" : "fa-regular fa-star";

        stars.appendChild(star);
    }

    const ratingText = document.createElement("span");
    ratingText.className = "rating-value";
    ratingText.textContent = ratingValue.toFixed(1);

    rating.setAttribute("aria-label", `Rated ${ratingValue.toFixed(1)} out of 5 stars`);

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

    // Add to cart
    const addButton = document.createElement("button");
    addButton.className = "add-to-cart-btn";
    addButton.type = "button";
    addButton.textContent = "Add to Cart";

    addButton.addEventListener("click", () => {
        if (!isLoggedIn()) {
            const returnUrl =
                window.location.pathname +
                window.location.search;

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

/* CATEGORIES */

function getCategories() {
    const tags = allProducts.flatMap(
        (product) => product.tags || []
    );

    return [...new Set(tags)].sort((a, b) =>
        a.localeCompare(b)
    );
}

function renderCategories() {
    const categories = getCategories();

    // Category dropdown
    if (categoryFilter) {
        categoryFilter.replaceChildren();

        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "All Categories";
        categoryFilter.appendChild(allOption);

        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        const matchingCategory = categories.find(
            (category) =>
                category.toLowerCase() ===
                initialCategory.toLowerCase()
        );

        categoryFilter.value = matchingCategory || "all";
    }

    // Header and footer category links
    function createCategoryLink(category) {
        const link = document.createElement("a");
        link.href =
            `./index.html?category=${encodeURIComponent(category)}`;
        link.textContent = category;
        return link;
    }

    [categoriesNav, footerCategories].forEach((container) => {
        if (!container) {
            return;
        }

        container.replaceChildren();

        categories
        .slice(0, container === footerCategories ? 8 : undefined)
        .forEach((category) => {
            container.appendChild(createCategoryLink(category));
        });
    });
}

/* FILTER PRODUCTS */

function filterProducts() {
    const category = categoryFilter?.value || "all";

    const currentParams = new URLSearchParams(
        window.location.search
    );

    const search = (
        currentParams.get("search") || "").trim().toLowerCase();

    return allProducts.filter((product) => {
        const matchesCategory =
            category === "all" ||
            product.tags?.some(
                (tag) =>
                    tag.toLowerCase() === category.toLowerCase()
            );

        
        const title = (product.title || "").toLowerCase();
        const description = (product.description || "").toLowerCase();

        const matchesSearch =
            !search ||
            title.includes(search) ||
            description.includes(search);

        return matchesCategory && matchesSearch;
    });
}


/* SORT PRODUCTS */

function sortProducts(products) {
    const sorted = [...products];

    switch (sortOrder?.value) {
        case "price-low":
            return sorted.sort(
                (a, b) => getProductPrice(a) - getProductPrice(b)
            );

        case "price-high":
            return sorted.sort(
                (a, b) => getProductPrice(b) - getProductPrice(a)
            );

        case "name-asc":
            return sorted.sort(
                (a, b) => a.title.localeCompare(b.title)
            );

        case "name-desc":
            return sorted.sort(
                (a, b) => b.title.localeCompare(a.title)
            );

        case "rating":
            return sorted.sort(
                (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
            );

        default:
            return sorted;
    }
}

/* RENDER PRODUCTS */

function renderProducts() {
    if (!productsGrid) {
        return;
    }

    const filteredProducts = filterProducts();
    const sortedProducts = sortProducts(filteredProducts);

    productsGrid.replaceChildren();

    if (productsMessage) {
        productsMessage.textContent = "";
    }

    if (sortedProducts.length === 0) {
        if (productsMessage) {
            productsMessage.textContent =
                "No products match your search or filters.";
        }
        return;
    }

    sortedProducts.forEach((product) => {
        productsGrid.appendChild(
            createProductCard(product)
        );
    });
}

/* FILTER EVENTS */

categoryFilter?.addEventListener("change", () => {
    const params = new URLSearchParams(
        window.location.search
    );

    if (categoryFilter.value === "all") {
        params.delete("category");
    } else {
        params.set("category", categoryFilter.value);
    }

    const query = params.toString();

    window.history.replaceState(
        null,
        "",
        window.location.pathname + (query ? `?${query}` : "")
    );

    renderProducts();
});

sortOrder?.addEventListener("change", renderProducts);

/* SEARCH */

searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = searchForm.querySelector("input");
    const search = input?.value.trim() || "";

    const params = new URLSearchParams(
        window.location.search
    );

    if (search) {
        params.set("search", search);
    } else {
        params.delete("search");
    }

    const query = params.toString();

    window.history.replaceState(
        null,
        "",
        window.location.pathname + (query ? `?${query}` : "")
    );

    renderProducts();
});


/* CATEGORIES DROPDOWN */

const categoriesButton = document.getElementById("categories-btn");

function closeCategoriesMenu() {
    if (!categoriesButton || !categoriesNav) return;

    categoriesNav.hidden = true;
    categoriesButton.setAttribute("aria-expanded", "false");
}

categoriesButton?.addEventListener("click", () => {
    const isOpen = categoriesButton.getAttribute("aria-expanded") === "true";

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

    const accountUrl = loggedIn
        ? "../account/index.html"
        : "../account/login.html";

    if (accountLink) {
        accountLink.href = accountUrl;
        accountLink.setAttribute(
            "aria-label",
            loggedIn ? "My account" : "Log in"
        );

        const accountText = accountLink.querySelector("span");

        if (accountText) {
            accountText.textContent = loggedIn
                ? "My Account"
                : "Log in";
        }
    }

    if (footerAccountLink) {
        footerAccountLink.href = accountUrl;
        footerAccountLink.textContent = loggedIn
            ? "My Account"
            : "Log In";
    }
}



/* INITIALIZE PRODUCTS */

async function initProducts() {
    initFastCart();
    updateAccountLink();

    if (productsMessage) {
        productsMessage.textContent = "Loading products...";
    }

    try {
        allProducts = await fetchAll();

        renderCategories();

        const searchInput = searchForm?.querySelector("input");

        if (searchInput) {
            searchInput.value = initialSearch;
        }

        renderProducts();

    } catch (error) {
        console.error("Unable to load products:", error);

        if (productsMessage) {
            productsMessage.textContent =
                "Unable to load products. Please try again.";
        }
    }
}

initProducts();
