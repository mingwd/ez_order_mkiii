
import { useEffect, useState, useCallback, useRef, useMemo } from "react";

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

    const [hoveredPlaceId, setHoveredPlaceId] = useState(null);
    const listItemRefs = useRef({});

    const placeNames = useMemo(
        () => Object.fromEntries(rests.map((r) => [r.google_place_id, r.name])),
        [rests]
    );

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
            <div className="w-screen h-screen flex items-center justify-center">
                <div className="ez-card rounded-2xl px-8 py-6 text-sm font-medium text-[var(--ez-muted)]">
                    Loading…
                </div>
            </div>
        );
    }

    if (user && user.user_type === "owner") {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center px-4">
                <div className="ez-card rounded-3xl px-8 py-8 text-center max-w-lg">
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] mb-3">
                        Merchant account
                    </p>
                    <h1 className="text-2xl font-bold text-[var(--ez-ink)] mb-2">
                        You are logged in as merchant
                    </h1>
                    <p className="text-sm text-[var(--ez-muted)] mb-6 leading-relaxed">
                        Customer ordering is disabled for merchant accounts.
                        <br />
                        Please go to the merchant dashboard to manage your restaurants & menus.
                    </p>

                    <div className="flex items-center justify-center gap-3 mt-2">
                        <button
                            className="btn-ghost"
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

    function handlePinHover(placeId) {
        setHoveredPlaceId(placeId);
        if (!placeId) return;
        listItemRefs.current[placeId]?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
        });
    }
    const cartCount = cartItems.reduce((s, c) => s + c.qty, 0);
    const cartRestaurantCount = new Set(
        cartItems.map((c) => c.restaurantName)
    ).size;

    return (
        <div className="w-screen h-screen overflow-y-auto lg:overflow-hidden flex flex-col">
            <header className="ez-header shrink-0 w-full sticky top-0 z-30">
                <div className="h-[72px] px-5 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img src={logo} alt="eazy-order logo" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
                        <span className="text-lg md:text-xl tracking-tight text-[var(--ez-primary)] font-extrabold">
                            Eazy Order
                        </span>
                    </div>

                    <button
                        onClick={handleAiOrderClick}
                    >
                        Pick for me
                    </button>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <button
                                className="btn-secondary"
                                onClick={() => navigate("/profile")}
                            >
                                {user.username}
                            </button>
                        ) : (
                            <button
                                className="btn-secondary"
                                onClick={() => navigate("/auth")}
                            >
                                Guest
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 min-h-0 w-full px-4 md:px-6 pb-4">
                <div className="grid grid-cols-12 gap-4 md:gap-5 lg:h-full">
                    <div className="col-span-12 lg:col-span-8 ez-card rounded-3xl h-[36vh] min-h-[200px] lg:h-full lg:min-h-0 overflow-hidden">
                        <div className="w-full h-full">
                            <MapView
                                onPlaceIds={handlePlaceIds}
                                onMarkerClick={handleMarkerClick}
                                onMarkerHover={handlePinHover}
                                hoveredPlaceId={hoveredPlaceId}
                                placeNames={placeNames}
                                allowedPlaceIds={allowedIds}
                            />
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
                        <div className="ez-card rounded-3xl p-4 sm:p-5 flex-1 flex flex-col min-h-[20.5rem] lg:min-h-0">
                            <div className="mb-3 sm:mb-4">
                                <h2 className="text-lg font-bold tracking-tight">
                                    Nearby restaurants
                                </h2>
                                <p className="text-xs text-[var(--ez-muted)] mt-0.5">
                                    Tap a place to open its menu
                                </p>
                            </div>

                            {resolveLoading && (
                                <div className="text-sm text-[var(--ez-muted)] mb-3">
                                    Loading…
                                </div>
                            )}
                            {resolveErr && (
                                <div className="text-sm text-red-600 mb-3">
                                    {resolveErr}
                                </div>
                            )}

                            <ul className="space-y-2 overflow-y-auto ez-scroll pr-1 flex-1 min-h-[14.5rem] lg:min-h-0">
                                {rests.map((r) => (
                                    <li
                                        key={r.id}
                                        ref={(el) => {
                                            if (el) listItemRefs.current[r.google_place_id] = el;
                                            else delete listItemRefs.current[r.google_place_id];
                                        }}
                                        onClick={() => openMenu(r)}
                                        onMouseEnter={() => setHoveredPlaceId(r.google_place_id)}
                                        onMouseLeave={() => setHoveredPlaceId(null)}
                                        className={`rounded-xl p-3.5 cursor-pointer transition ${
                                            hoveredPlaceId === r.google_place_id
                                                ? "ez-list-item-active"
                                                : "bg-[var(--ez-bg)] hover:bg-[#efefef]"
                                        }`}
                                    >
                                        <div className="font-semibold text-[var(--ez-ink)]">
                                            {r.name}
                                        </div>
                                        <div className="text-sm text-[var(--ez-muted)] mt-0.5">
                                            {r.address}
                                        </div>
                                    </li>
                                ))}
                                {!resolveLoading && rests.length === 0 && (
                                    <li className="text-sm text-[var(--ez-muted)] py-8 text-center">
                                        No supported restaurants nearby.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="ez-card rounded-3xl p-5 shrink-0">
                            <div className="flex items-baseline justify-between gap-3">
                                <div className="text-sm font-bold">Cart</div>
                                <div className="text-xs text-[var(--ez-muted)]">
                                    {cartItems.length === 0
                                        ? "Empty"
                                        : `${cartCount} item(s) · ${cartRestaurantCount} restaurant(s)`}
                                </div>
                            </div>
                            <div className="text-xs text-[var(--ez-muted)] mb-3 mt-1">
                                {cartItems.length === 0
                                    ? "Your items will appear here."
                                    : ""}
                            </div>

                            {cartItems.length > 0 && (
                                <div className="max-h-24 overflow-y-auto ez-scroll text-xs text-[var(--ez-ink)] mb-3 space-y-1.5">
                                    {cartItems.map((c) => (
                                        <div key={`${c.restaurantId}-${c.itemId}`} className="flex justify-between gap-3">
                                            <span className="truncate">
                                                {c.qty} × {c.name}
                                            </span>
                                            <span className="text-[var(--ez-muted)] shrink-0">
                                                {c.restaurantName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                className="w-full"
                                onClick={handleOrderNow}
                                disabled={cartItems.length === 0}
                            >
                                Order now
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {active && (
                    <div
                        className="fixed inset-0 ez-overlay flex items-center justify-center p-4 z-40"
                        onClick={closeModal}
                    >
                        <div
                            className="w-full max-w-xl ez-card rounded-3xl shadow-lg p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeModal}
                                className="btn-icon absolute right-4 top-4"
                                aria-label="Close"
                            >
                                ×
                            </button>

                            <h3 className="text-xl font-bold text-[var(--ez-ink)] pr-10">
                                {active.name}
                            </h3>
                            {active.address && (
                                <p className="text-sm text-[var(--ez-muted)] mb-4 mt-1">
                                    {active.address}
                                </p>
                            )}

                            {itemsLoading && (
                                <div className="text-sm text-[var(--ez-muted)]">
                                    Loading menu…
                                </div>
                            )}
                            {itemsErr && !itemsLoading && (
                                <div className="text-sm text-red-600">
                                    {itemsErr}
                                </div>
                            )}

                            {!itemsLoading && !itemsErr && (
                                <div className="max-h-80 overflow-y-auto ez-scroll divide-y divide-[var(--ez-line)]">
                                    {items.length === 0 ? (
                                        <div className="text-sm text-[var(--ez-muted)] py-4">
                                            No items.
                                        </div>
                                    ) : (
                                        items.map((it) => (
                                            <div
                                                key={it.id}
                                                className="flex items-start justify-between py-3.5 gap-3"
                                            >
                                                <div>
                                                    <div className="font-semibold text-[var(--ez-ink)]">
                                                        {it.name}
                                                    </div>
                                                    {it.description && (
                                                        <div className="text-xs text-[var(--ez-muted)] mt-0.5 leading-relaxed">
                                                            {it.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-3 flex flex-col items-end gap-2 shrink-0">
                                                    <div className="font-semibold tabular-nums text-[var(--ez-ink)]">
                                                        $
                                                        {Number(
                                                            it.price
                                                        ).toFixed(2)}
                                                    </div>
                                                    <button
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
                                    className="btn-ghost"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleOrderNow}
                                    disabled={cartItems.length === 0}
                                >
                                    Order now
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {orderSuccess && (
                    <div
                        className="fixed inset-0 ez-overlay flex items-center justify-center p-4 z-50"
                        onClick={() => setOrderSuccess(null)}
                    >
                        <div
                            className="w-full max-w-lg ez-card rounded-3xl shadow-lg p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setOrderSuccess(null)}
                                className="btn-icon absolute right-4 top-4"
                                aria-label="Close order success"
                            >
                                ×
                            </button>

                            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] mb-2">
                                Confirmed
                            </p>
                            <h3 className="text-2xl font-bold text-[var(--ez-ink)] mb-2">
                                Order placed!
                            </h3>
                            <p className="text-sm text-[var(--ez-muted)] mb-4">
                                Thank you for your order. Your food is being prepared.
                            </p>

                            <div className="text-sm text-[var(--ez-ink)] space-y-1 mb-4 rounded-xl bg-[var(--ez-bg)] p-4">
                                <div>
                                    <span className="font-semibold">Order ID:</span>{" "}
                                    #{orderSuccess.orderId}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Restaurant:
                                    </span>{" "}
                                    {orderSuccess.restaurantName}
                                </div>
                                <div>
                                    <span className="font-semibold">Total:</span>{" "}
                                    ${Number(orderSuccess.totalPrice).toFixed(2)}
                                </div>
                            </div>

                            <div className="border-t border-[var(--ez-line)] pt-3 mt-3 max-h-40 overflow-y-auto ez-scroll text-sm">
                                <div className="font-semibold text-[var(--ez-ink)] mb-2">
                                    Items
                                </div>
                                {orderSuccess.items.map((c) => (
                                    <div
                                        key={`${c.restaurantId}-${c.itemId}`}
                                        className="flex justify-between text-[var(--ez-ink)] mb-1"
                                    >
                                        <span>
                                            {c.qty} × {c.name}
                                        </span>
                                        <span className="tabular-nums">
                                            ${(c.qty * c.price).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {orderSuccess.aiMessage && (
                                <div className="mt-4 border-t border-[var(--ez-line)] pt-3 text-sm text-[var(--ez-muted)]">
                                    <div className="font-semibold text-[var(--ez-ink)] mb-1">
                                        Why we picked this (AI):
                                    </div>
                                    <p className="leading-relaxed">{orderSuccess.aiMessage}</p>
                                </div>
                            )}

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    className="btn-ghost"
                                    onClick={() => setOrderSuccess(null)}
                                >
                                    Close
                                </button>
                                <button
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
                )}

            {loginPromptOpen && (
                    <div
                        className="fixed inset-0 ez-overlay flex items-center justify-center p-4 z-50"
                        onClick={() => setLoginPromptOpen(false)}
                    >
                        <div
                            className="w-full max-w-sm ez-card rounded-3xl shadow-lg p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setLoginPromptOpen(false)}
                                className="btn-icon absolute right-4 top-4"
                                aria-label="Close login prompt"
                            >
                                ×
                            </button>

                            <h3 className="text-xl font-bold text-[var(--ez-ink)] mb-2">
                                Please log in
                            </h3>
                            <p className="text-sm text-[var(--ez-muted)] mb-5 leading-relaxed">
                                Login or Signup before placing an order.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="btn-ghost"
                                    onClick={() => setLoginPromptOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
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
                )}

            {authOpen && (
                    <div
                        className="fixed inset-0 ez-overlay flex items-center justify-center p-4 z-50"
                        onClick={closeAuth}
                    >
                        <div
                            className="w-full max-w-sm ez-card rounded-3xl shadow-lg p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeAuth}
                                className="btn-icon absolute right-4 top-4"
                                aria-label="Close auth"
                                disabled={authLoading}
                            >
                                ×
                            </button>

                            <h3 className="text-xl font-bold text-[var(--ez-ink)] mb-2">
                                {authMode === "login" ? "Login" : "Sign up"}
                            </h3>
                            <p className="text-xs text-[var(--ez-muted)] mb-4">
                                当前入口都是 customer 账号，owner 以后走单独商家后台。
                            </p>

                            <form onSubmit={handleAuthSubmit} className="space-y-3">
                                <div>
                                    <label>
                                        Username
                                    </label>
                                    <input
                                        value={authUsername}
                                        onChange={(e) =>
                                            setAuthUsername(e.target.value)
                                        }
                                        disabled={authLoading}
                                    />
                                </div>
                                <div>
                                    <label>
                                        Password
                                    </label>
                                    <input
                                        type="password"
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
                                    className="w-full mt-1"
                                    disabled={authLoading}
                                >
                                    {authLoading
                                        ? "Working..."
                                        : authMode === "login"
                                            ? "Login"
                                            : "Sign up"}
                                </button>
                            </form>

                            <div className="mt-3 text-xs text-[var(--ez-muted)] text-center">
                                {authMode === "login" ? (
                                    <>
                                        No account?{" "}
                                        <button
                                            type="button"
                                            className="btn-link"
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
                                            className="btn-link"
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
                )}
        </div>
    );
}