// src/pages/MerchantDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiMerchantMyRestaurants } from "../api/client";

export default function MerchantDashboard() {
    const nav = useNavigate();
    const [rests, setRests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                const d = await apiMerchantMyRestaurants();
                setRests(d.restaurants || []);
            } catch (e) {
                console.error(e);
                setErr("Failed to load restaurants. Are you logged in as merchant?");
                // 如果是 401/403，你也可以直接 nav("/merchant/auth")
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center">
                Loading…
            </div>
        );
    }

    return (
        <div className="w-screen min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">
                            My Restaurants
                        </h1>
                        <p className="text-sm text-gray-500">
                            商家后台 · 管理你名下的餐厅和菜单
                        </p>
                    </div>
                    <button
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm"
                        onClick={() => nav("/")}
                    >
                        Back to customer site
                    </button>
                </div>

                {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

                {rests.length === 0 ? (
                    <div className="text-sm text-gray-500">
                        目前你还没有绑定餐厅。（以后这里可以加「Create restaurant」按钮）
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {rests.map((r) => (
                            <div
                                key={r.id}
                                className="bg-white border rounded-xl p-4 shadow-sm hover:border-orange-300 cursor-pointer transition"
                                onClick={() => nav(`/merchant/restaurants/${r.id}/menu`)}
                            >
                                <div className="font-semibold text-gray-800">
                                    {r.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {r.address}
                                </div>
                                <div className="mt-2 text-xs text-gray-400">
                                    Google place_id: {r.google_place_id}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}