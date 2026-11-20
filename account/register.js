import { fetchAll } from "../shared/api.js";

const REGISTER_URL = "https://v2.api.noroff.dev/auth/register";

const registerForm = document.getElementById("register-form");
const registerMessage = document.getElementById("register-message");
const registerButton = registerForm?.querySelector(
    'button[type="submit"]'
);

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

loadFooterCategories();

/* REGISTER USER */

async function registerUser(userData) {
    const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            result.errors?.[0]?.message ||
            "Registration failed. Please try again."
        );
    }

    if (!result?.data) {
        throw new Error("Invalid response from the registration service.");
    }

    return result.data;
}

/* FORM */

registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = formData.get("confirmPassword");

    /* VALIDATION */

    if (!name || !email || !password) {
        registerMessage.textContent =
            "Please fill in all required fields.";
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        registerMessage.textContent =
            "Username can only contain letters, numbers and underscores.";
        return;
    }

    if (!/^[^\s@]+@(stud\.)?noroff\.no$/i.test(email)) {
    registerMessage.textContent =
        "Please use a valid Noroff email address.";
    return;
    }

    if (password.length < 8) {
        registerMessage.textContent =
            "Password must contain at least 8 characters.";
        return;
    }

    if (password !== confirmPassword) {
        registerMessage.textContent =
            "Passwords do not match.";
        return;
    }


    /* REQUIRED INFO */

    const userData = {
        name,
        email,
        password
    };


    /* REGISTER BTN */

    if (registerButton) {
        registerButton.disabled = true;
    }

    registerMessage.textContent = "Creating your account...";

    try {
        await registerUser(userData);

        registerMessage.textContent =
            "Account created successfully!";

            const redirect = new URLSearchParams(window.location.search).get("redirect");

        window.location.href = redirect ? `./login.html?redirect=${encodeURIComponent(redirect)}` : "./login.html";

    } catch (error) {
        console.error("Registration failed:", error);

        registerMessage.textContent = error.message;

    } finally {
        if (registerButton) {
            registerButton.disabled = false;
        }
    }
});
