// src/pages/MerchantMenu.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { apiMerchantRestaurantItems } from "../api/client";

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
        <div className="w-screen min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            {/* 顶部条：餐厅信息 + 按钮 */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        {restaurant?.name || `Restaurant #${restId}`}
                    </h1>
                    {restaurant?.address && (
                        <p className="text-sm text-gray-500">
                            {restaurant.address}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
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

            {/* Menu Items */}
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6">
                {loading && (
                    <div className="text-sm text-gray-500">Loading menu…</div>
                )}
                {err && !loading && (
                    <div className="text-sm text-red-600 mb-3">{err}</div>
                )}

                {!loading && !err && items.length === 0 && (
                    <div className="text-sm text-gray-500">
                        No items yet. Click “New item” to create one.
                    </div>
                )}

                {!loading && !err && items.length > 0 && (
                    <ul className="space-y-3">
                        {items.map((it) => (
                            <li
                                key={it.id}
                                className="shadow-md rounded-lg px-4 py-3 flex justify-between items-start"
                            >
                                <div>
                                    <div className="font-medium text-gray-800">
                                        {it.name}
                                    </div>
                                    {it.description && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {it.description}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-600 mt-1">
                                        ${Number(it.price).toFixed(2)}
                                    </div>
                                </div>

                                <button
                                    className="px-3 py-1 rounded-lg border text-xs hover:bg-gray-50"
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
    );
}