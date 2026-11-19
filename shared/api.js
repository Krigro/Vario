
const ENDPOINT = "https://v2.api.noroff.dev/online-shop";

export async function fetchAll() {
    const response = await fetch(ENDPOINT);

    if (!response.ok) {
        throw new Error("Failed to load products");
    }

    const json = await response.json();

    if (!json || !Array.isArray(json.data)) {
        return [];
    }

    return json.data;
}

export async function fetchOne(id) {
    const response = await fetch(
        ENDPOINT + "/" + encodeURIComponent(id)
    );

    if (!response.ok) {
        throw new Error("Product not found");
    }

    const json = await response.json();

    return json.data || null;
}
