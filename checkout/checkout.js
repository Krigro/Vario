
import { fetchAll, fetchOne } from "../shared/api.js";
import { getCart } from "../shared/cart-storage.js";
import { isLoggedIn } from "../shared/auth.js";

const checkoutForm = document.getElementById("checkout-form");
const checkoutItems = document.getElementById("checkout-items");
const checkoutSubtotal = document.getElementById("checkout-subtotal");
const checkoutShipping = document.getElementById("checkout-shipping");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutMessage = document.getElementById("checkout-message");
const placeOrderButton = document.getElementById("place-order-btn");

const ORDER_KEY = "vario_last_order";

let orderProducts = [];
let orderTotal = 0;
let isReady = false;
let loadedCart = [];

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
                ? "My Account"
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

/* CREATE ORDER ITEM */

function createOrderItem(product, quantity) {
    const item = document.createElement("div");
    item.className = "checkout-item";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "checkout-item-image";

    const image = document.createElement("img");
    image.src = product.image?.url || "";
    image.alt = product.image?.alt || product.title;

    imageWrapper.appendChild(image);

    const details = document.createElement("div");
    details.className = "checkout-item-details";

    const title = document.createElement("h3");
    title.className = "checkout-item-title";
    title.textContent = product.title;

    const quantityText = document.createElement("p");
    quantityText.className = "checkout-item-quantity";
    quantityText.textContent = `Quantity: ${quantity}`;

    details.append(title, quantityText);

    const price = document.createElement("p");
    price.className = "checkout-item-price";
    price.textContent = formatPrice(
        getProductPrice(product) * quantity
    );

    item.append(imageWrapper, details, price);

    return item;
}

/* RENDER ORDER SUMMARY */

async function renderOrderSummary() {
    const cart = getCart();

    isReady = false;
    orderProducts = [];
    orderTotal = 0;
    loadedCart = [];

    if (placeOrderButton) {
        placeOrderButton.disabled = true;
    }

    if (checkoutItems) {
        checkoutItems.replaceChildren();
    }

    if (checkoutMessage) {
        checkoutMessage.textContent = "Loading your order...";
    }

    if (cart.length === 0) {
        if (checkoutMessage) {
            checkoutMessage.textContent = "Your cart is empty.";
        }

        return;
    }

    try {
        const products = await Promise.all(
            cart.map(async (item) => {
                const product = await fetchOne(item.id);

                if (!product) {
                    throw new Error("Product not found");
                }

                return {
                    product,
                    quantity: item.qty
                };
            })
        );

        if (JSON.stringify(cart) !== JSON.stringify(getCart())) {
            return renderOrderSummary();
        }

        orderProducts = products;
        loadedCart = cart;
        orderTotal = 0;

        products.forEach(({ product, quantity }) => {
            orderTotal += getProductPrice(product) * quantity;

            if (checkoutItems) {
                checkoutItems.appendChild(
                    createOrderItem(product, quantity)
                );
            }
        });

        if (checkoutSubtotal) {
            checkoutSubtotal.textContent = formatPrice(orderTotal);
        }

        if (checkoutShipping) {
            checkoutShipping.textContent = formatPrice(0);
        }

        if (checkoutTotal) {
            checkoutTotal.textContent = formatPrice(orderTotal);
        }

        if (checkoutMessage) {
            checkoutMessage.textContent = "";
        }

        isReady = true;

        if (placeOrderButton) {
            placeOrderButton.disabled = false;
        }

    } catch (error) {
        console.error("Unable to load order:", error);

        if (checkoutMessage) {
            checkoutMessage.textContent =
                "Unable to load your order. Please try again.";
        }
    }
}

/* REQUIRED FIELD */

const requiredFields = checkoutForm.querySelectorAll(
    ".delivery-section [required]"
);

// Add required indicators
requiredFields.forEach((field) => {
    const formGroup = field.closest(".form-group");

    if (!formGroup) return;

    const indicator = document.createElement("span");
    indicator.className = "required-indicator";
    indicator.textContent = "*";
    indicator.setAttribute("aria-hidden", "true");

    formGroup.appendChild(indicator);
});

// Show an error for a field
function showFieldError(field) {
    const formGroup = field.closest(".form-group");

    if (!formGroup) return;

    let error = formGroup.querySelector(".field-error");

    if (!error) {
        error = document.createElement("p");
        error.className = "field-error";
        formGroup.appendChild(error);
    }

    error.textContent = field.validity.valueMissing
        ? "This field is required."
        : field.validationMessage;

    field.setAttribute("aria-invalid", "true");
}

// Remove an error
function clearFieldError(field) {
    const formGroup = field.closest(".form-group");

    formGroup?.querySelector(".field-error")?.remove();
    field.removeAttribute("aria-invalid");
}

// Validate all required fields
function validateCheckoutForm() {
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach((field) => {
        if (!field.checkValidity()) {
            showFieldError(field);
            isValid = false;

            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else {
            clearFieldError(field);
        }
    });

    const paymentOptions = document.querySelector(".payment-options");
    const selectedPayment = checkoutForm.querySelector(
        'input[name="payment"]:checked'
    );

    paymentOptions.querySelector(".payment-error")?.remove();
    paymentOptions.classList.remove("has-error");

    if (!selectedPayment) {
        const error = document.createElement("p");
        error.className = "field-error payment-error";
        error.textContent = "Please select a payment method.";

        paymentOptions.appendChild(error);
        paymentOptions.classList.add("has-error");

        isValid = false;

        if (!firstInvalidField) {
            firstInvalidField = checkoutForm.querySelector(
                'input[name="payment"]'
            );
        }
    }

    firstInvalidField?.focus();

    return isValid;
}

requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
        if (field.checkValidity()) {
            clearFieldError(field);
        }
    });

    field.addEventListener("change", () => {
        if (field.checkValidity()) {
            clearFieldError(field);
        }
    });
});

checkoutForm.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", () => {
        const paymentOptions = document.querySelector(".payment-options");

        paymentOptions.querySelector(".payment-error")?.remove();
        paymentOptions.classList.remove("has-error");
    });
});

/* PLACE ORDER */

checkoutForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (JSON.stringify(getCart()) !== JSON.stringify(loadedCart)) {
        renderOrderSummary();
        return;
    }

    if (!validateCheckoutForm()) return;

    if (!isReady || orderProducts.length === 0) {
        return;
    }

    if (!isLoggedIn()) {
        const returnUrl =
            window.location.pathname +
            window.location.search;

        window.location.href =
            `../account/login.html?redirect=${encodeURIComponent(returnUrl)}`;

        return;
    }

    isReady = false;

    if (placeOrderButton) {
        placeOrderButton.disabled = true;
    }

    const order = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        products: orderProducts.map(({ product, quantity }) => ({
            id: product.id,
            title: product.title,
            price: getProductPrice(product),
            quantity: quantity
        })),
        total: orderTotal
    };

    try {
        sessionStorage.setItem(
            ORDER_KEY,
            JSON.stringify(order)
        );

        window.location.href = "../success/index.html";

    } catch (error) {
        console.error("Unable to save order:", error);

        if (checkoutMessage) {
            checkoutMessage.textContent =
                "Unable to complete your order. Please try again.";
        }

        isReady = true;

        if (placeOrderButton) {
            placeOrderButton.disabled = false;
        }
    }
});

/* INITIALIZE CHECKOUT */

function initCheckout() {
    updateAccountLink();
    loadFooterCategories();

    if (!isLoggedIn()) {
        const returnUrl =
            window.location.pathname +
            window.location.search;

        window.location.href =
            `../account/login.html?redirect=${encodeURIComponent(returnUrl)}`;

        return;
    }

    renderOrderSummary();
}

window.addEventListener("authUpdated", updateAccountLink);

initCheckout();
