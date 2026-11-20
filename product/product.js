
import { fetchAll, fetchOne } from "../shared/api.js";
import { addToCart, getCart } from "../shared/cart-storage.js";
import { initFastCart, openFastCart } from "../shared/fast-cart.js";
import { isLoggedIn, getCurrentUser } from "../shared/auth.js";

const productContainer = document.getElementById("product-container");
const productMessage = document.getElementById("product-message");
const reviewsContainer = document.getElementById("reviews-container");
const categoriesNav = document.getElementById("categories");
const footerCategories = document.getElementById("footer-categories");
const cartButton = document.getElementById("cart-btn");
const cartCount = document.getElementById("cart-count");

/* ACCOUNT LINK */

function updateAccountLink() {
    const accountLink = document.getElementById("account-link");
    const footerAccountLink = document.getElementById("footer-account-link");

    const loggedIn = isLoggedIn ();

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


/* PRODUCT ID */

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const FAVORITES_KEY_PREFIX = "vario_favorites_v1";

/* FORMAT PRICE */

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
}

/* CART COUNT */

function updateCartCount() {
    if (!cartCount) return;
    

    const cart = getCart();
    const count = cart.reduce(
        (total, item) => total + Number(item.qty || 0),
        0
    );

    cartCount.textContent = String(count);
    cartCount.hidden = count === 0;
}

/* HEADER */

function initHeader() {
    if (cartButton) {
        cartButton.addEventListener("click", () => {
            openFastCart();
        });
    }

    updateCartCount();
}

/* CATEGORIES DROPDOWN */

async function renderCategories() {
    const categoriesButton = document.getElementById("categories-btn");
    const categoriesMenu = document.getElementById("categories");

    if (!categoriesButton || !categoriesMenu) {
        return;
    }

    categoriesButton.addEventListener("click", () => {
        const isOpen = !categoriesMenu.hidden;

        categoriesMenu.hidden = isOpen;
        categoriesButton.setAttribute("aria-expanded", String(!isOpen)
        );
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".categories-dropdown")) {
            categoriesMenu.hidden = true;
            categoriesButton.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !categoriesMenu.hidden) {
            categoriesMenu.hidden = true;
            categoriesButton.setAttribute("aria-expanded", "false");
            categoriesButton.focus();
        }
    });

    try {
        const products = await fetchAll();

        const categories = [
            ...new Set(
                products.flatMap((product) => product.tags || [])
            )
        ].sort((a, b) => a.localeCompare(b));

        categoriesMenu.replaceChildren();

        if (footerCategories) {
            footerCategories.replaceChildren();
        }

        categories.forEach((category) => {
            const url =
                `../products/index.html?category=${encodeURIComponent(category)}`;

            const menuLink = document.createElement("a");
            menuLink.href = url;
            menuLink.textContent = category;
            categoriesMenu.appendChild(menuLink);

            if (footerCategories && footerCategories.children.length < 8) {
                const footerLink = document.createElement("a");
                footerLink.href = url;
                footerLink.textContent = category;
                footerCategories.appendChild(footerLink);
            }
        });

    } catch (error) {
        console.error("Unable to load categories:", error);
    }
}


/* RATING */

function createStars(ratingValue) {
    const stars = document.createElement("span");
    stars.className = "stars";

    const rating = Math.max(
        0,
        Math.min(5, Math.round(Number(ratingValue) || 0))
    );

    for (let index = 1; index <= 5; index++) {
        const star = document.createElement("i");

        star.className = index <= rating
            ? "fa-solid fa-star"
            : "fa-regular fa-star";

        star.setAttribute("aria-hidden", "true");
        stars.appendChild(star);
    }

    return stars;
}

/* Product details */

function renderProduct(product) {
    if (!productContainer) return;
    
    productContainer.replaceChildren();

    /* img */

    const imageContainer = document.createElement("div");
    imageContainer.className = "product-gallery";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "product-main-image";

    const image = document.createElement("img");
    image.src = product.image?.url || "";
    image.alt = product.image?.alt || product.title;

    imageWrapper.appendChild(image);
    imageContainer.appendChild(imageWrapper);

    /* details */

    const info = document.createElement("div");
    info.className = "product-information";

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = (product.tags || []).join(" / ");

    const title = document.createElement("h1");
    title.className = "product-title";
    title.textContent = product.title;

    /* RATING */

    const rating = document.createElement("div");
    rating.className = "product-rating";
    rating.appendChild(createStars(product.rating));

    const ratingText = document.createElement("span");
    ratingText.textContent = `${product.rating ?? "Not rated"} / 5`;
    rating.appendChild(ratingText);

    const reviewsLink = document.createElement("a");
    reviewsLink.href = "#reviews-heading";
    reviewsLink.textContent = `${product.reviews?.length || 0} reviews`;
    rating.appendChild(reviewsLink);

    /* PRICE */

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

    /* DESCRIPTION */

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description || "";

    /* TAGS */

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "product-tags";

    (product.tags || []).forEach((tag) => {
        const link = document.createElement("a");
        link.className = "product-tag";
        link.href = `../products/index.html?category=${encodeURIComponent(tag)}`;
        link.textContent = tag;
        tagsContainer.appendChild(link);
    });

    /* QUANTITY */

    const options = document.createElement("div");
    options.className = "product-options";

    const quantityLabel = document.createElement("span");
    quantityLabel.className = "quantity-label";
    quantityLabel.textContent = "Quantity";

    const quantitySelector = document.createElement("div");
    quantitySelector.className = "quantity-selector";

    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.textContent = "-";
    decreaseButton.setAttribute("aria-label", "Decrease quantity");

    const quantityValue = document.createElement("span");
    quantityValue.textContent = "1";

    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.textContent = "+";
    increaseButton.setAttribute("aria-label", "Increase quantity");

    let quantity = 1;

    decreaseButton.addEventListener("click", () => {
        quantity = Math.max(1, quantity - 1);
        quantityValue.textContent = String(quantity);
    });

    increaseButton.addEventListener("click", () => {
        quantity += 1;
        quantityValue.textContent = String(quantity);
    });

    quantitySelector.append(
        decreaseButton,
        quantityValue,
        increaseButton
    );

    options.append(quantityLabel, quantitySelector);

    /* ADD TO CART */

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

        addToCart(product.id, quantity);
        updateCartCount();
        openFastCart();
    });

    /* FAVORITE BUTTON */

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
            isFavorite ? "Remove from wishlist" : "Add to wishlist"
        );

        favoriteButton.setAttribute(
            "aria-pressed",
            String(isFavorite)
        );
    }

    updateFavoriteButton();

    favoriteButton.addEventListener("click", () => {
        if (!isLoggedIn() || !getCurrentUser()?.email) {
            const returnUrl = 
            window.location.pathname + window.location.search;

            window.location.href = 
            `../account/login.html?redirect=${encodeURIComponent(returnUrl)}`;

            return;
        }

        toggleFavorite(product.id);
        updateFavoriteButton();
    });

    /* PRODUCT ACTIONS */

    const productActions = document.createElement("div");
    productActions.className = "product-actions";

    productActions.append(
        addButton,
        favoriteButton
    );

    /* SHARE PRODUCT */

    const shareContainer = document.createElement("div");
    shareContainer.className = "product-share";

    const shareButton = document.createElement("button");
    shareButton.type = "button";
    shareButton.className = "share-button";

    const shareIcon = document.createElement("i");
    shareIcon.className = "fa-solid fa-share-nodes";
    shareIcon.setAttribute("aria-hidden", "true");

    const shareText = document.createElement("span");
    shareText.textContent = "Share Product";

    shareButton.append(shareIcon, shareText);

    const shareMessage = document.createElement("span");
    shareMessage.className = "share-message";
    shareMessage.setAttribute("role", "status");

    shareButton.addEventListener("click", async () => {
        const url = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: product.title,
                    text: `Check out ${product.title} at VARIO!`,
                    url: url
                });
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                shareMessage.textContent = "Link copied!";
            } else {
                shareMessage.textContent = "Copy the URL from your browser to share this product.";
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                shareMessage.textContent = "Unable to share this product.";
            }
        }
    });

    shareContainer.append(shareButton, shareMessage);

    /* ADD PRODUCT INFORMATION */

    info.append(
        category,
        title,
        rating,
        priceContainer,
        description,
        tagsContainer,
        options,
        productActions,
        shareContainer
    );

    productContainer.append(imageContainer, info);
}

/* REVIEWS */

function renderReviews(reviews) {
    if (!reviewsContainer) {
        return;
    }

    reviewsContainer.replaceChildren();

    if (!Array.isArray(reviews) || reviews.length === 0) {
        const message = document.createElement("p");
        message.className = "reviews-message";
        message.textContent = "No reviews yet for this product.";
        reviewsContainer.appendChild(message);
        return;
    }

    reviews.forEach((review) => {

        const card = document.createElement("article");
        card.className = "review-card";

        const header = document.createElement("div");
        header.className = "review-header";

        const author = document.createElement("span");
        author.className = "review-author";
        author.textContent = review.username || "Anonymous";

        const rating = document.createElement("div");
        rating.className = "review-rating";
        rating.appendChild(createStars(review.rating));

        const ratingText = document.createElement("span");
        ratingText.textContent = `${review.rating ?? 0} / 5`;
        rating.appendChild(ratingText);

        header.append(author, rating);

        const description = document.createElement("p");
        description.className = "review-description";
        description.textContent =
            review.description || "No written review.";

        card.append(header, description);
        reviewsContainer.appendChild(card);
    });
}

/* INITIALIZE PRODUCT PAGE */

async function initProduct() {
    initFastCart();
    initHeader();
    updateAccountLink();
    renderCategories();

    if (!productId) {
        if (productMessage) {
            productMessage.textContent = "Product not found.";
        }

        return;
    }

    if (productMessage) {
        productMessage.textContent = "Loading product...";
    }

    try {
        const product = await fetchOne(productId);

        if (!product) {
            throw new Error("Product not found.");
        }

        renderProduct(product);
        renderReviews(product.reviews);

        if (productMessage) {
            productMessage.textContent = "";
        }

        document.title = `${product.title} | VARIO`;
    } catch (error) {
        console.error("Unable to load product:", error);

        if (productMessage) {
            productMessage.textContent =
                "Unable to load this product. Please try again.";
        }
    }
}

initProduct();
