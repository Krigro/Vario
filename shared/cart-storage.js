const KEY = "vario_cart_v1";


export function getCart() {
    try {
        const items = JSON.parse(localStorage.getItem(KEY));

        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}


function saveCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));

    window.dispatchEvent(new Event("cartUpdated"));
}


export function addToCart(id, qty = 1) {
    if (!id || !Number.isInteger(qty) || qty < 1) {
        return;
    }

    const items = getCart();

    const existingItem = items.find(
        (item) => item.id === id
    );

    if (existingItem) {
        existingItem.qty += qty;
    } else {
        items.push({ id, qty });
    }

    saveCart(items);
}


export function updateQuantity(id, qty) {
    if (!Number.isInteger(qty)) {
        return;
    }

    if (qty <= 0) {
        removeFromCart(id);
        return;
    }

    const items = getCart();

    const item = items.find(
        (item) => item.id === id
    );

    if (!item) {
        return;
    }

    item.qty = qty;

    saveCart(items);
}


export function removeFromCart(id) {
    const items = getCart().filter(
        (item) => item.id !== id
    );

    saveCart(items);
}

export function clearCart() {
    saveCart([]);
}

export function cartCount() {
    const items = getCart();
    let total = 0;

    for (let i = 0; i < items.length; i++) {
        total += items[i].qty;
    }

    return total;
}
