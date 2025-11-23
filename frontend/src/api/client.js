// src/api/client.js
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

export async function apiAiOrder(restaurantIds) {
    const token = localStorage.getItem("access");
    const resp = await fetch("http://127.0.0.1:8000/api/restaurants/ai_order/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            restaurant_ids: restaurantIds,   // [1, 2, 3]
        }),
    });

    if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || data.error || "AI order failed");
    }
    return resp.json();
}

function authHeaders() {
    const t = localStorage.getItem("access");
    return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function apiRegisterCustomer(username, password) {
    const r = await fetch(`${BASE}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }), // 不传 user_type，后端默认 customer
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

export async function apiPlaceOrder(restaurantId, items) {
    // items: [{ item_id: 1, quantity: 2 }, ...]
    const r = await fetch(`${BASE}/api/restaurants/orders/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        body: JSON.stringify({
            restaurant_id: restaurantId,
            items,
        }),
    });

    if (!r.ok) {
        if (r.status === 401) {
            // 方便前端识别“没登录 / token 过期”
            throw new Error("unauthorized");
        }
        throw new Error("order failed");
    }
    return r.json();
}


export async function apiRegisterMerchant(username, password) {
    const r = await fetch(`${BASE}/api/auth/merchant/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export async function apiMerchantMyRestaurants() {
    const r = await fetch(`${BASE}/api/merchant/restaurants/my/`, {
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
    });
    if (r.status === 401) {
        throw new Error("unauthorized");
    }
    if (!r.ok) throw new Error("merchant restaurants failed");
    return r.json();
}

export async function apiMerchantGetItem(itemId) {
    const r = await fetch(`${BASE}/api/merchant/items/${itemId}/`, {
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
    });
    if (!r.ok) throw new Error("merchant get item failed");
    return r.json();
}

// 更新单个菜品
export async function apiMerchantUpdateItem(itemId, payload) {
    const r = await fetch(`${BASE}/api/merchant/items/${itemId}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("merchant update item failed");
    return r.json();
}


export async function apiMerchantRestaurantItems(restId) {
    // 目前先直接复用客户端的 items 接口
    return apiItems(restId);
}

export async function apiMerchantCreateItem(restId, payload) {
    const r = await fetch(`${BASE}/api/merchant/restaurants/${restId}/items/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("merchant create item failed");
    return r.json();
}

export async function apiMerchantTags() {
    const r = await fetch(`${BASE}/api/merchant/tags/`, {
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
    });
    if (!r.ok) throw new Error("merchant tags failed");
    return r.json();
}