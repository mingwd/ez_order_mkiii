const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
export async function apiResolve(placeIds) {
    const r = await fetch(`${BASE}/api/restaurants/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_ids: placeIds }),
    });
    if (!r.ok) throw new Error("resolve failed");
    return r.json();
}

export async function apiItems(restId) {
    const r = await fetch(`${BASE}/api/restaurants/${restId}/items`);
    if (!r.ok) throw new Error("items failed");
    return r.json();
}
