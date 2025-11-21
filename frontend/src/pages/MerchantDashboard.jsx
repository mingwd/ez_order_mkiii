// src/pages/MerchantDashboard.jsx
import { useEffect, useState } from "react";
import { apiMerchantMyRestaurants } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function MerchantDashboard() {
    const nav = useNavigate();
    const [rests, setRests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const d = await apiMerchantMyRestaurants();
                setRests(d.restaurants || []);
            } catch (e) {
                console.error(e);
                setErr("Failed to load restaurants.");
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
        <div className="p-6 w-full min-h-screen bg-gray-50 flex flex-col items-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                My Restaurants
            </h1>

            {err && <div className="text-red-600 text-sm mb-4">{err}</div>}

            <div className="w-full max-w-3xl space-y-4">
                {rests.map((r) => (
                    <div
                        key={r.id}
                        className="bg-white border shadow-sm rounded-xl p-5 flex justify-between items-start"
                    >
                        <div>
                            <div className="text-lg font-semibold text-gray-800">
                                {r.name}
                            </div>
                            <div className="text-sm text-gray-500">
                                {r.address}
                            </div>
                        </div>

                        <button
                            className="px-4 py-2 bg-orange-300 hover:bg-orange-400 rounded-lg text-sm font-medium text-gray-900"
                            onClick={() =>
                                nav(`/merchant/restaurants/${r.id}/menu`, {
                                    state: { restaurant: r },
                                })
                            }
                        >
                            Edit
                        </button>
                    </div>
                ))}

                {rests.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-10">
                        You have no restaurants yet.
                    </div>
                )}
            </div>
        </div>
    );
}