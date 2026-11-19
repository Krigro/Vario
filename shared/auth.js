/* AUTHENTICATION */
import { clearCart } from "./cart-storage.js";

const TOKEN_KEY = "vario_access_token";
const USER_KEY = "vario_user";

export function isLoggedIn() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getCurrentUser() {
    try {
        const user = localStorage.getItem(USER_KEY);

        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    clearCart();

    window.dispatchEvent(new Event("authUpdated"));
}
