// src/pages/Home.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import {
    apiResolve,
    apiItems,
    apiAiOrder,
    apiMe,
    apiPlaceOrder,
} from "../api/client";
import MapView from "../components/MapView";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    // ---- 用户 & 登录状态 ----
    const [user, setUser] = useState(null);

    // 未登录下单弹窗
    const [authRequiredOpen, setAuthRequiredOpen] = useState(false);

    // 页面加载时尝试恢复登录状态
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem("access");
            if (!token) return;
            try {
                const me = await apiMe();
                setUser(me);
            } catch {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
            }
        })();
    }, []);

    // ---- 地图 / 餐厅 / 菜品 ----
    const [rests, setRests] = useState([]);
    const [allowedIds, setAllowedIds] = useState([]);
    const [active, setActive] = useState(null);

    const [resolveLoading, setResolveLoading] = useState(false);
    const [resolveErr, setResolveErr] = useState("");
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsErr, setItemsErr] = useState("");
    const [items, setItems] = useState([]);

    // ---- Cart 状态 ----
    // { itemId, name, price, restaurantId, restaurantName, qty }
    const [cartItems, setCartItems] = useState([]);

    // Map 回调：place_ids -> resolve
    const handlePlaceIds = useCallback(async (ids) => {
        try {
            setResolveErr("");
            setResolveLoading(true);
            if (!ids || ids.length === 0) {
                setRests([]);
                setAllowedIds([]);
                return;
            }
            const d = await apiResolve(ids);
            const list = (d && d.restaurants) || [];
            setRests(list);
            setAllowedIds(list.map((r) => r.google_place_id));
        } catch (e) {
            console.error(e);
            setRests([]);
            setAllowedIds([]);
            setResolveErr("Resolve failed.");
        } finally {
            setResolveLoading(false);
        }
    }, []);

    // 为 marker click 查找右侧餐厅
    const restsRef = useRef(rests);
    useEffect(() => {
        restsRef.current = rests;
    }, [rests]);

    const handleMarkerClick = useCallback((placeId) => {
        const r =
            restsRef.current.find(
                (x) =>
                    x.google_place_id === placeId ||
                    x.place_id === placeId ||
                    x.placeId === placeId ||
                    x.googlePlaceId === placeId
            ) || null;
        if (r) openMenu(r);
        else console.log("Marker clicked but not in resolved list:", placeId);
    }, []);

    async function openMenu(r) {
        setActive(r);
        setItems([]);
        setItemsErr("");
        setItemsLoading(true);
        try {
            const d = await apiItems(r.id);
            setItems((d && d.items) || []);
        } catch (e) {
            console.error(e);
            setItemsErr("Failed to load menu.");
        } finally {
            setItemsLoading(false);
        }
    }

    function closeModal() {
        setActive(null);
        setItems([]);
        setItemsErr("");
    }

    // ---- Add to cart ----
    function handleAddToCart(item) {
        if (!active) return;

        setCartItems((prev) => {
            const idx = prev.findIndex(
                (c) => c.itemId === item.id && c.restaurantId === active.id
            );
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = {
                    ...next[idx],
                    qty: next[idx].qty + 1,
                };
                return next;
            }
            return [
                ...prev,
                {
                    itemId: item.id,
                    name: item.name,
                    price: Number(item.price),
                    restaurantId: active.id,
                    restaurantName: active.name,
                    qty: 1,
                },
            ];
        });
    }

    // ---- 真·下单 ----
    async function handleOrderNow() {
        if (cartItems.length === 0) {
            alert("Cart is empty.");
            return;
        }

        // 没登录 → 弹登录提示
        if (!user) {
            setAuthRequiredOpen(true);
            return;
        }

        // 简化：目前只允许一个订单来自一个餐厅
        const restaurantId = cartItems[0].restaurantId;
        const mixedRestaurant = cartItems.some(
            (c) => c.restaurantId !== restaurantId
        );
        if (mixedRestaurant) {
            alert("For now, you can only order from one restaurant at a time.");
            return;
        }

        const itemsPayload = cartItems.map((c) => ({
            item_id: c.itemId,
            quantity: c.qty,
        }));

        try {
            const res = await apiPlaceOrder(restaurantId, itemsPayload);
            alert(
                `Order #${res.order_id} placed!\nTotal: $${res.total_price}\n(Preferences updated on backend)`
            );
            setCartItems([]);
        } catch (e) {
            console.error(e);
            if (String(e.message) === "unauthorized") {
                // token 过期或没带 → 也走登录提示
                setAuthRequiredOpen(true);
                return;
            }
            alert("Order failed: " + e.message);
        }
    }

    // ---- Order for me：先随便调 OpenAI 说句话 ----
    async function handleAiOrderClick() {
        try {
            const d = await apiAiOrder();
            alert(d.message || "AI 没说话 😂");
        } catch (e) {
            alert("AI order failed: " + e.message);
        }
    }

    // ---- 购物车统计 ----
    const cartCount = cartItems.reduce((s, c) => s + c.qty, 0);
    const cartRestaurantCount = new Set(
        cartItems.map((c) => c.restaurantName)
    ).size;

    // ---- 渲染 ----
    return (
        <div className="w-screen h-screen overflow-x-hidden bg-gray-50 flex flex-col">
            {/* Header: 20% */}
            <header className="h-[20vh] w-full border-b bg-white">
                <div className="h-full px-6 flex items-center justify-between">
                    {/* 左：Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-300/70" />
                        <span className="font-semibold text-gray-800">
                            eazy-order
                        </span>
                    </div>

                    {/* 中：Order for me */}
                    <button
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 hover:bg-gray-200 transition text-sm font-medium"
                        onClick={handleAiOrderClick}
                    >
                        Order for me
                    </button>

                    {/* 右：用户 / 登录 */}
                    <div className="text-sm text-gray-700 flex items-center gap-3">
                        {user ? (
                            <button
                                className="px-3 py-1 rounded-lg border hover:bg-gray-100"
                                onClick={() => navigate("/profile")}
                            >
                                {user.username}
                            </button>
                        ) : (
                            <button
                                className="px-3 py-1 rounded-lg border hover:bg-gray-100"
                                onClick={() => navigate("/auth")}
                            >
                                Guest
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main: 60% */}
            <main className="h-[60vh] w-full px-6 py-4">
                <div className="grid grid-cols-12 gap-6 h-full">
                    {/* 左边地图 */}
                    <div className="col-span-8 bg-white rounded-xl border shadow-sm p-0 h-full">
                        <div className="w-full h-full rounded-xl overflow-hidden">
                            <MapView
                                onPlaceIds={handlePlaceIds}
                                onMarkerClick={handleMarkerClick}
                                allowedPlaceIds={allowedIds}
                            />
                        </div>
                    </div>

                    {/* 右侧餐厅列表 */}
                    <div className="col-span-4 bg-white rounded-xl border shadow-sm p-4 h-full flex flex-col min-h-0">
                        <h2 className="text-xl font-semibold mb-2 text-gray-800">
                            Nearby Restaurants
                        </h2>

                        {resolveLoading && (
                            <div className="text-sm text-gray-500 mb-2">
                                Loading…
                            </div>
                        )}
                        {resolveErr && (
                            <div className="text-sm text-red-600 mb-2">
                                {resolveErr}
                            </div>
                        )}

                        <ul className="space-y-3 overflow-y-auto pr-1 flex-1">
                            {rests.map((r) => (
                                <li
                                    key={r.id}
                                    onClick={() => openMenu(r)}
                                    className="border rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition"
                                >
                                    <div className="font-medium text-gray-800">
                                        {r.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {r.address}
                                    </div>
                                </li>
                            ))}
                            {!resolveLoading && rests.length === 0 && (
                                <li className="text-sm text-gray-500">
                                    No supported restaurants nearby.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </main>

            {/* Footer: 20% + Cart */}
            <footer className="h-[20vh] w-full border-t bg-white relative">
                <div className="absolute right-4 bottom-4 w-80 rounded-2xl border-2 border-dashed border-gray-300 bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
                    <div className="text-sm font-medium text-gray-700">
                        Cart
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                        {cartItems.length === 0
                            ? "Your items will appear here."
                            : `${cartCount} item(s) from ${cartRestaurantCount} restaurant(s)`}
                    </div>

                    {cartItems.length > 0 && (
                        <div className="max-h-20 overflow-y-auto text-xs text-gray-700 mb-2 space-y-1">
                            {cartItems.map((c) => (
                                <div
                                    key={`${c.restaurantId}-${c.itemId}`}
                                >
                                    {c.qty} × {c.name} ({c.restaurantName})
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        className="w-full px-3 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={handleOrderNow}
                        disabled={cartItems.length === 0}
                    >
                        Order now
                    </button>
                </div>
            </footer>

            {/* 菜单弹窗 */}
            {active && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeModal}
                            className="absolute right-4 top-4 text-gray-500 hover:text-black text-xl leading-none"
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <h3 className="text-lg font-semibold text-gray-800">
                            {active.name}
                        </h3>
                        {active.address && (
                            <p className="text-sm text-gray-500 mb-3">
                                {active.address}
                            </p>
                        )}

                        {itemsLoading && (
                            <div className="text-sm text-gray-500">
                                Loading menu…
                            </div>
                        )}
                        {itemsErr && !itemsLoading && (
                            <div className="text-sm text-red-600">
                                {itemsErr}
                            </div>
                        )}

                        {!itemsLoading && !itemsErr && (
                            <div className="max-h-80 overflow-y-auto divide-y">
                                {items.length === 0 ? (
                                    <div className="text-sm text-gray-500 py-4">
                                        No items.
                                    </div>
                                ) : (
                                    items.map((it) => (
                                        <div
                                            key={it.id}
                                            className="flex items-start justify-between py-3"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-800">
                                                    {it.name}
                                                </div>
                                                {it.description && (
                                                    <div className="text-xs text-gray-500">
                                                        {it.description}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-3 flex flex-col items-end gap-2">
                                                <div className="font-mono text-gray-700">
                                                    ${Number(
                                                        it.price
                                                    ).toFixed(2)}
                                                </div>
                                                <button
                                                    className="px-2 py-1 rounded-lg border text-xs hover:bg-gray-50"
                                                    onClick={() =>
                                                        handleAddToCart(it)
                                                    }
                                                >
                                                    Add to cart
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm text-gray-700"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleOrderNow}
                                className="px-4 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={cartItems.length === 0}
                            >
                                Order now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 未登录下单提示弹窗 */}
            {authRequiredOpen && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                    onClick={() => setAuthRequiredOpen(false)}
                >
                    <div
                        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute right-4 top-4 text-gray-400 hover:text-black text-xl leading-none"
                            aria-label="Close auth required"
                            onClick={() => setAuthRequiredOpen(false)}
                        >
                            ×
                        </button>

                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Login required
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            下单需要登录账号。你可以先注册 / 登录一个 customer 账号。
                        </p>

                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 text-gray-700"
                                onClick={() => setAuthRequiredOpen(false)}
                            >
                                先不
                            </button>
                            <button
                                className="px-3 py-2 text-sm rounded-lg bg-orange-300 hover:bg-orange-400 text-gray-800 font-medium"
                                onClick={() => {
                                    setAuthRequiredOpen(false);
                                    navigate("/auth");
                                }}
                            >
                                去注册 / 登录
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}