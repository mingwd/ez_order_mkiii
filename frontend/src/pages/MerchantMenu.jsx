// src/pages/MerchantMenu.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { apiMerchantRestaurantItems } from "../api/client";
import MerchantBar from "../components/MerchantBar";

export default function MerchantMenu() {
    const { restId } = useParams();              // /merchant/restaurants/:restId/menu
    const location = useLocation();
    const nav = useNavigate();

    const initialRest = location.state?.restaurant || null;

    const [restaurant, setRestaurant] = useState(initialRest);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);
                const d = await apiMerchantRestaurantItems(restId);
                setItems(d.items || []);
            } catch (e) {
                console.error(e);
                setErr("Failed to load menu.");
            } finally {
                setLoading(false);
            }
        })();
    }, [restId]);

    return (
        <div className="w-screen min-h-screen flex flex-col items-center">
            <MerchantBar />
            <div className="p-6 w-full max-w-4xl">
            <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] mb-2">
                        Menu
                    </p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ez-ink)]">
                        {restaurant?.name || `Restaurant #${restId}`}
                    </h1>
                    {restaurant?.address && (
                        <p className="text-sm text-[var(--ez-muted)] mt-1">
                            {restaurant.address}
                        </p>
                    )}
                </div>

                <div className="flex gap-3 shrink-0">
                    <button
                        className="btn-ghost"
                        onClick={() => nav("/merchant/dashboard")}
                    >
                        Back
                    </button>
                    <button
                        onClick={() =>
                            nav(
                                `/merchant/restaurants/${restId}/items/new`
                            )
                        }
                    >
                        + New item
                    </button>
                </div>
            </div>

            <div className="w-full max-w-4xl ez-card rounded-3xl p-6">
                {loading && (
                    <div className="text-sm text-[var(--ez-muted)]">Loading menu…</div>
                )}
                {err && !loading && (
                    <div className="text-sm text-red-600 mb-3">{err}</div>
                )}

                {!loading && !err && items.length === 0 && (
                    <div className="text-sm text-[var(--ez-muted)] py-6 text-center">
                        No items yet. Click “New item” to create one.
                    </div>
                )}

                {!loading && !err && items.length > 0 && (
                    <ul className="space-y-3">
                        {items.map((it) => (
                            <li
                                key={it.id}
                                className="rounded-xl px-4 py-3.5 flex justify-between items-start gap-4 bg-[var(--ez-bg)]"
                            >
                                <div>
                                    <div className="font-semibold text-[var(--ez-ink)]">
                                        {it.name}
                                    </div>
                                    {it.description && (
                                        <div className="text-xs text-[var(--ez-muted)] mt-1 leading-relaxed">
                                            {it.description}
                                        </div>
                                    )}
                                    <div className="text-sm font-semibold mt-2">
                                        ${Number(it.price).toFixed(2)}
                                    </div>
                                </div>

                                <button
                                    className="btn-secondary"
                                    onClick={() =>
                                        nav(
                                            `/merchant/items/${it.id}/edit`
                                        )
                                    }
                                >
                                    Edit
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            </div>
        </div>
    );
}