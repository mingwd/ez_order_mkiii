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

export async function apiAiOrder() {
    const r = await fetch(`${BASE}/api/ai_order/`, { method: "POST" });
    if (!r.ok) throw new Error("AI order failed");
    return r.json();
}

function authHeaders() {
    const t = localStorage.getItem("access");
    return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function apiRegisterCustomer(username, password) {
    const r = await fetch(`${BASE}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }), // 不传 user_type
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export async function apiLogin(username, password) {
    const r = await fetch(`${BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    return data;
}

export async function apiMe() {
    const r = await fetch(`${BASE}/api/auth/me/`, {
        headers: {
            ...authHeaders(),
        },
    });
    if (!r.ok) throw new Error("me failed");
    return r.json();
}

export async function apiGetProfile() {
    const r = await fetch(`${BASE}/api/auth/profile/`, {
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
    });
    if (!r.ok) throw new Error("profile get failed");
    return r.json();
}

export async function apiUpdateProfile(payload) {
    const r = await fetch(`${BASE}/api/auth/profile/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("profile update failed");
    return r.json();
}