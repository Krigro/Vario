import { clearCart } from "../shared/cart-storage.js";

const successMessage = document.getElementById("success-message");

const ORDER_KEY = "vario_last_order";

/* INITIALIZE SUCCESS PAGE */ 

function initSuccess() {
    const savedOrder = sessionStorage.getItem(ORDER_KEY);

    if (!savedOrder) {
        if (successMessage) {
            successMessage.textContent =
                "No order confirmation was found.";
        }
        
        return;
    }

    try {
        const order = JSON.parse(savedOrder);

        if (
            !order.id ||
            !Array.isArray(order.products) ||
            order.products.length === 0 ||
            !Number.isFinite(order.total)
        ) {
            throw new Error("Invalid order information");
        }

        clearCart();

        if (successMessage) {
            successMessage.textContent =
                "Your order has been placed successfully!";
        }

    } catch (error) {
        console.error(
            "Unable to confirm order:",
            error
        );

        if (successMessage) {
            successMessage.textContent =
                "Unable to confirm your order.";
        }
    }
}

initSuccess();
