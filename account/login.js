
/* ACCOUNT - LOGIN */

import { fetchAll } from "../shared/api.js";

const LOGIN_URL = "https://v2.api.noroff.dev/auth/login";

const TOKEN_KEY = "vario_access_token";
const USER_KEY = "vario_user";


const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginButton = loginForm?.querySelector(
    'button[type="submit"]'
);

/* LOGIN USER */

async function loginUser(email, password) {
    const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            result.errors?.[0]?.message ||
            "Unable to log in. Please check your email and password."
        );
    }

    if (!result.data?.accessToken) {
        throw new Error("No access token was received.");
    }

    return result.data;
}

/* REDIRECT AFTER LOGIN */

function getRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (!redirect) {
        return "../index.html";
    }

    if (
        !redirect.startsWith("/") ||
        redirect.startsWith("//") ||
        redirect.includes("\\")
    ) {
        return "../index.html";
    }

    const url = new URL(redirect, window.location.origin);

    if (url.origin !== window.location.origin) {
        return "../index.html";
    }

    return url.pathname + url.search + url.hash;
}

const registerLink = document.getElementById("register-link");

if (registerLink) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (redirect) {
        registerLink.href = `./register.html?redirect=${encodeURIComponent(getRedirectUrl())}`;
    }
}
/* FORM SUBMIT */

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    /* VALIDATION */

    if (!email || !password) {
        loginMessage.textContent =
            "Please enter your email and password.";
        return;
    }

    /* SEND LOGIN REQUEST */

    if (loginButton) {
        loginButton.disabled = true;
    }

    loginMessage.textContent = "Logging in...";

    try {
        const user = await loginUser(email, password);

        /* SAVE USER DATA */
        localStorage.setItem(
            TOKEN_KEY,
            user.accessToken
        );

        localStorage.setItem(
            USER_KEY,
            JSON.stringify({
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                banner: user.banner
            })
        );

        loginMessage.textContent =
            "Login successful! Redirecting...";

        /* REDIRECT USER */

        window.location.href = getRedirectUrl();

    } catch (error) {
        console.error("Login failed:", error);

        loginMessage.textContent = error.message;

    } finally {
        if (loginButton) {
            loginButton.disabled = false;
        }
    }
});

/* FOOTER */

async function loadFooterCategories() {
    const container = document.getElementById("footer-categories");

    if (!container) return;

    try {
        const products = await fetchAll();

        const categories = [
            ...new Set(
                products.flatMap((product) => product.tags || [])
            )
        ].slice(0, 8);

        container.replaceChildren();

        categories.forEach((category) => {
            const link = document.createElement("a");

            link.href = `../products/index.html?category=${encodeURIComponent(category)}`;
            link.textContent = category;

            container.appendChild(link);
        });

    } catch (error) {
        console.error("Unable to load footer categories:", error);
    }
}

loadFooterCategories();
