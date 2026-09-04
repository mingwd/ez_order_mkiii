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
            <div className="w-screen h-screen flex items-center justify-center text-[var(--ez-muted)]">
                Loading…
            </div>
        );
    }

    return (
        <div className="p-6 w-full min-h-screen flex flex-col items-center">
            <div className="w-full max-w-3xl mb-6">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] mb-2">
                    Merchant
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ez-ink)]">
                    My Restaurants
                </h1>
            </div>

            {err && <div className="text-red-600 text-sm mb-4">{err}</div>}

            <div className="w-full max-w-3xl space-y-3">
                {rests.map((r) => (
                    <div
                        key={r.id}
                        className="ez-card rounded-3xl p-5 flex justify-between items-start gap-4"
                    >
                        <div>
                            <div className="text-lg font-bold text-[var(--ez-ink)]">
                                {r.name}
                            </div>
                            <div className="text-sm text-[var(--ez-muted)] mt-0.5">
                                {r.address}
                            </div>
                        </div>

                        <button
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
                    <div className="ez-card rounded-3xl text-center text-[var(--ez-muted)] text-sm py-12">
                        You have no restaurants yet.
                    </div>
                )}
            </div>
        </div>
    );
}