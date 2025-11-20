// src/pages/MerchantMenu.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiItems } from "../api/client";

export default function MerchantMenu() {
    const nav = useNavigate();
    const { restId } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // 简单：餐厅名称暂时从 URL query 或者以后用一个 detail API 拉，这里先留个占位
    const [restaurantName, setRestaurantName] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);
                const d = await apiItems(restId);
                setItems(d.items || []);
                // 以后这里可以顺便调用一个 /api/merchant/restaurants/<id>/detail 来拿 name
                // 暂时先不折腾
            } catch (e) {
                console.error(e);
                setErr("Failed to load menu.");
            } finally {
                setLoading(false);
            }
        })();
    }, [restId]);

    return (
        <div className="w-screen min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Manage Menu
                        </h1>
                        <p className="text-sm text-gray-500">
                            Restaurant ID: {restId} {restaurantName && `· ${restaurantName}`}
                        </p>
                    </div>
                    <button
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm"
                        onClick={() => nav("/merchant/dashboard")}
                    >
                        Back to my restaurants
                    </button>
                </div>

                {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

                <div className="flex justify-end mb-3">
                    <button
                        className="px-3 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800"
                        onClick={() => nav(`/merchant/restaurants/${restId}/items/new`)}
                    >
                        + New item
                    </button>
                </div>

                {loading ? (
                    <div className="text-sm text-gray-500">Loading menu…</div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-gray-500">
                        This restaurant has no items yet.
                    </div>
                ) : (
                    <div className="bg-white border rounded-xl shadow-sm divide-y">
                        {items.map((it) => (
                            <div
                                key={it.id}
                                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
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
                                    <div className="text-xs text-gray-400 mt-1">
                                        ${Number(it.price).toFixed(2)} ·{" "}
                                        {it.is_active ? "active" : "inactive"}
                                    </div>
                                </div>
                                <button
                                    className="px-3 py-1 rounded-lg border text-xs hover:bg-gray-100"
                                    onClick={() =>
                                        nav(`/merchant/items/${it.id}/edit`)
                                    }
                                >
                                    Edit
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}