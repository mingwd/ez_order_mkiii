
import { useEffect, useState, useCallback, useRef } from "react";

import {
    apiResolve,
    apiItems,
    apiAiOrder,
    apiLogin,
    apiRegisterCustomer,
    apiMe,
    apiPlaceOrder,
} from "../api/client";
import logo from "../assets/ezlogo.png";
import MapView from "../components/MapView";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    // user & auth
    const [user, setUser] = useState(null);
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState("login");
    const [authUsername, setAuthUsername] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // login in alart
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);

    // order success
    const [orderSuccess, setOrderSuccess] = useState(null);
    // orderSuccess：
    // { orderId, totalPrice, restaurantName, items: [...], aiMessage? }

    const [userChecked, setUserChecked] = useState(false); // checked login status

    // restore login status on page load
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem("access");
            if (!token) {
                setUserChecked(true);
                return;
            }
            try {
                const me = await apiMe();
                setUser(me);
            } catch {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
            } finally {
                setUserChecked(true);
            }
        })();
    }, []);

    // map, restaurants, menu
    const [rests, setRests] = useState([]);
    const [allowedIds, setAllowedIds] = useState([]);
    const [active, setActive] = useState(null);

    const [resolveLoading, setResolveLoading] = useState(false);
    const [resolveErr, setResolveErr] = useState("");
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsErr, setItemsErr] = useState("");
    const [items, setItems] = useState([]);

    // ---- cart ----
    const [cartItems, setCartItems] = useState([]);
    // cart item: { itemId, name, price, restaurantId, restaurantName, qty }

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

    function handleLogout() {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
    }

    if (!userChecked) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
                Loading…
            </div>
        );
    }

    if (user && user.user_type === "owner") {
        return (
            <div className="w-screen h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="bg-white rounded-2xl shadow-md px-8 py-6 text-center max-w-lg">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                        You are logged in as <span className="text-orange-500">merchant</span>
                    </h1>
                    <p className="text-sm text-gray-600 mb-4">
                        Customer ordering is disabled for merchant accounts.
                        <br />
                        Please go to the merchant dashboard to manage your restaurants & menus.
                    </p>

                    <div className="flex items-center justify-center gap-3 mt-2">

                        <button
                            className="px-4 py-2 rounded-lg border hover:bg-gray-100 text-sm text-gray-700"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    async function handleAiOrderClick() {
        // login required
        if (!user) {
            setLoginPromptOpen(true);
            return;
        }
        if (!rests || rests.length === 0) {
            alert("Walking around to find more restaurants!");
            return;
        }

        try {
            const ids = rests.map((r) => r.id);
            const resp = await apiAiOrder(ids);
            // resp: { order_id, restaurant_id, restaurant_name, items, total_price, ai_comment }

            // format items for summary
            const summaryItems = resp.items.map((it) => ({
                restaurantId: resp.restaurant_id,
                itemId: it.item_id,
                name: it.name,
                qty: it.quantity,
                price: Number(it.price),
                restaurantName: resp.restaurant_name,
            }));

            setOrderSuccess({
                orderId: resp.order_id,
                totalPrice: resp.total_price,
                restaurantName: resp.restaurant_name,
                items: summaryItems,
                aiMessage: resp.ai_comment,
            });
        } catch (e) {
            console.error(e);
            alert(e.message || "AI order failed.");
        }
    }


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

    // ---- submit order ----
    async function handleOrderNow() {
        if (cartItems.length === 0) {
            alert("Cart is empty.");
            return;
        }

        // login required
        if (!user) {
            setLoginPromptOpen(true);
            return;
        }

        // Order from only one restaurant at a time
        const restIds = [...new Set(cartItems.map((c) => c.restaurantId))];
        if (restIds.length > 1) {
            alert("Please order from one restaurant at a time.");
            return;
        }
        const restaurantId = restIds[0];
        const restaurantName =
            cartItems.find((c) => c.restaurantId === restaurantId)?.restaurantName ||
            "";

        const payloadItems = cartItems
            .filter((c) => c.restaurantId === restaurantId)
            .map((c) => ({
                item_id: c.itemId,
                quantity: c.qty,
            }));

        try {
            const resp = await apiPlaceOrder(restaurantId, payloadItems);
            // resp: { order_id, total_price, updated_prefs }

            const totalPrice =
                resp.total_price ||
                cartItems
                    .filter((c) => c.restaurantId === restaurantId)
                    .reduce((s, c) => s + c.qty * c.price, 0)
                    .toFixed(2);

            const summaryItems = cartItems.filter(
                (c) => c.restaurantId === restaurantId
            );

            // clear cart
            setCartItems([]);
            setActive(null);

            // show order success
            setOrderSuccess({
                orderId: resp.order_id,
                totalPrice: totalPrice,
                restaurantName,
                items: summaryItems,
                aiMessage: null,
            });
        } catch (e) {
            console.error(e);
            alert("Order failed. Please try again.");
        }
    }


    // ---- Auth ----
    async function handleAuthSubmit(e) {
        e.preventDefault();
        if (!authUsername || !authPassword) {
            setAuthError("Username / password 不能为空");
            return;
        }
        try {
            setAuthError("");
            setAuthLoading(true);

            if (authMode === "signup") {
                await apiRegisterCustomer(authUsername, authPassword);
            }

            await apiLogin(authUsername, authPassword);
            const me = await apiMe();
            if (me.user_type && me.user_type !== "customer") {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                setUser(null);
                setAuthError("Only customer accounts can use this site.");
                return;
            }
            setUser(me);
            setAuthOpen(false);
            setAuthUsername("");
            setAuthPassword("");
        } catch (err) {
            console.error(err);
            setAuthError("Auth failed");
        } finally {
            setAuthLoading(false);
        }
    }

    function closeAuth() {
        if (authLoading) return;
        setAuthOpen(false);
    }

    const cartCount = cartItems.reduce((s, c) => s + c.qty, 0);
    const cartRestaurantCount = new Set(
        cartItems.map((c) => c.restaurantName)
    ).size;

    return (
        <div className="w-screen h-screen overflow-x-hidden flex flex-col">
            {/* Header: 10% */}
            <header className="h-[10vh] w-full">
                <div className="h-full px-8 flex items-center justify-between">
                    {/* left：Logo */}
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="eazy-order logo" className="w-10 h-10 object-contain rounded-lg opacity-90" />
                        <span className="text-xl tracking-wide text-[var(--ez-primary)] font-bold">
                            EAZY ORDER
                        </span>
                    </div>

                    {/*Order for me */}
                    <button
                        onClick={handleAiOrderClick}
                    >
                        Pick for me !
                    </button>

                    {/* user login */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <button
                                onClick={() => navigate("/profile")}
                            >
                                {user.username}
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/auth")}
                            >
                                Guest
                            </button>
                        )}
                    </div>
                </div>
            </header >

            {/* Main: 80% */}
            < main className="h-[80vh] w-full px-6 py-4" >
                <div className="grid grid-cols-12 gap-6 h-full">
                    {/* map area */}
                    <div className="col-span-8 rounded-xl shadow h-full">
                        <div className="w-full h-full rounded-xl overflow-hidden">
                            <MapView
                                onPlaceIds={handlePlaceIds}
                                onMarkerClick={handleMarkerClick}
                                allowedPlaceIds={allowedIds}
                            />
                        </div>
                    </div>

                    {/* restaurant list */}
                    <div className="col-span-4 rounded-xl shadow-[2px_2px_4px_0_#00000050] p-4 h-full flex flex-col min-h-0">
                        <h2 className="text-xl font-semibold mb-8">
                            Nearby Restaurants
                        </h2>

                        {resolveLoading && (
                            <div className="text-sm text-gray-500 mb-4">
                                Loading…
                            </div>
                        )}
                        {resolveErr && (
                            <div className="text-sm text-red-600 mb-4">
                                {resolveErr}
                            </div>
                        )}

                        <ul className="space-y-2 overflow-y-auto pr-2 flex-1">
                            {rests.map((r) => (
                                <li
                                    key={r.id}
                                    onClick={() => openMenu(r)}
                                    className="rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition shadow-[2px_2px_4px_0_#00000050]"
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
            </main >

            {/* Footer: 10% + Cart */}
            < footer className="h-[10vh] w-full px-6" >
                <div className="grid grid-cols-12 gap-6 h-full">
                    <div className="col-span-8 w-full h-full rounded-xl overflow-hidden"></div>
                    <div className="col-span-4 rounded-xl shadow-[2px_2px_4px_0_#00000050] backdrop-blur p-4">
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
                                    <div key={`${c.restaurantId}-${c.itemId}`}>
                                        {c.qty} x {c.name} ({c.restaurantName})
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
                </div>
            </footer >

            {/* Menu popup window */}
            {
                active && (
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
                                x
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
                                                        $
                                                        {Number(
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
                )
            }

            {/* order success */}
            {
                orderSuccess && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                        onClick={() => setOrderSuccess(null)}
                    >
                        <div
                            className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setOrderSuccess(null)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-black text-xl leading-none"
                                aria-label="Close order success"
                            >
                                ×
                            </button>

                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Order placed!
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Thank you for your order. Your food is being prepared.
                            </p>

                            <div className="text-sm text-gray-700 space-y-1 mb-4">
                                <div>
                                    <span className="font-medium">Order ID:</span>{" "}
                                    #{orderSuccess.orderId}
                                </div>
                                <div>
                                    <span className="font-medium">
                                        Restaurant:
                                    </span>{" "}
                                    {orderSuccess.restaurantName}
                                </div>
                                <div>
                                    <span className="font-medium">Total:</span>{" "}
                                    ${Number(orderSuccess.totalPrice).toFixed(2)}
                                </div>
                            </div>

                            <div className="border-t pt-3 mt-3 max-h-40 overflow-y-auto text-sm">
                                <div className="font-medium text-gray-800 mb-2">
                                    Items
                                </div>
                                {orderSuccess.items.map((c) => (
                                    <div
                                        key={`${c.restaurantId}-${c.itemId}`}
                                        className="flex justify-between text-gray-700 mb-1"
                                    >
                                        <span>
                                            {c.qty} × {c.name}
                                        </span>
                                        <span className="font-mono">
                                            ${(c.qty * c.price).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* AI explanation */}
                            {orderSuccess.aiMessage && (
                                <div className="mt-4 border-t pt-3 text-xs text-gray-600">
                                    <div className="font-medium mb-1">
                                        Why we picked this (AI):
                                    </div>
                                    <p>{orderSuccess.aiMessage}</p>
                                </div>
                            )}

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                                    onClick={() => setOrderSuccess(null)}
                                >
                                    Close
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800"
                                    onClick={() => {
                                        setOrderSuccess(null);
                                        navigate("/profile");
                                    }}
                                >
                                    View profile
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* order without valid account warning */}
            {
                loginPromptOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                        onClick={() => setLoginPromptOpen(false)}
                    >
                        <div
                            className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setLoginPromptOpen(false)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-black text-xl leading-none"
                                aria-label="Close login prompt"
                            >
                                x
                            </button>

                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Please log in
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Login or Signup before placing an order.
                            </p>

                            <div className="flex justify-end gap-4">
                                <button
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                                    onClick={() => setLoginPromptOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800"
                                    onClick={() => {
                                        setLoginPromptOpen(false);
                                        navigate("/auth");
                                    }}
                                >
                                    Go to login / sign up
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 登录 / 注册弹窗（目前实际上不怎么用，因为我们跳 /auth） */}
            {
                authOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                        onClick={closeAuth}
                    >
                        <div
                            className="w-full max-w-sm bg白 rounded-2xl shadow-lg p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeAuth}
                                className="absolute right-4 top-4 text-gray-400 hover:text-black text-xl leading-none"
                                aria-label="Close auth"
                                disabled={authLoading}
                            >
                                ×
                            </button>

                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {authMode === "login" ? "Login" : "Sign up"}
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                当前入口都是 customer 账号，owner 以后走单独商家后台。
                            </p>

                            <form onSubmit={handleAuthSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Username
                                    </label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                                        value={authUsername}
                                        onChange={(e) =>
                                            setAuthUsername(e.target.value)
                                        }
                                        disabled={authLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                                        value={authPassword}
                                        onChange={(e) =>
                                            setAuthPassword(e.target.value)
                                        }
                                        disabled={authLoading}
                                    />
                                </div>

                                {authError && (
                                    <div className="text-xs text-red-600">
                                        {authError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full mt-1 px-3 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={authLoading}
                                >
                                    {authLoading
                                        ? "Working..."
                                        : authMode === "login"
                                            ? "Login"
                                            : "Sign up"}
                                </button>
                            </form>

                            <div className="mt-3 text-xs text-gray-500 text-center">
                                {authMode === "login" ? (
                                    <>
                                        No account?{" "}
                                        <button
                                            type="button"
                                            className="underline"
                                            disabled={authLoading}
                                            onClick={() => {
                                                setAuthMode("signup");
                                                setAuthError("");
                                            }}
                                        >
                                            Sign up
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <button
                                            type="button"
                                            className="underline"
                                            disabled={authLoading}
                                            onClick={() => {
                                                setAuthMode("login");
                                                setAuthError("");
                                            }}
                                        >
                                            Login
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}