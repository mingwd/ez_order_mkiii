// src/pages/MerchantDashboard.jsx
import { useEffect, useState } from "react";
import { apiMerchantMyRestaurants, apiMerchantCreateRestaurant } from "../api/client";
import { useNavigate } from "react-router-dom";
import MerchantBar from "../components/MerchantBar";

const emptyForm = {
    name: "",
    address: "",
    latitude: "47.606200",
    longitude: "-122.332100",
    google_place_id: "",
};

export default function MerchantDashboard() {
    const nav = useNavigate();
    const [rests, setRests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formErr, setFormErr] = useState("");

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

    function handleField(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!form.name.trim()) {
            setFormErr("Name is required.");
            return;
        }
        try {
            setSaving(true);
            setFormErr("");
            const created = await apiMerchantCreateRestaurant({
                name: form.name.trim(),
                address: form.address.trim(),
                latitude: form.latitude || undefined,
                longitude: form.longitude || undefined,
                google_place_id: form.google_place_id.trim() || undefined,
            });
            setRests((prev) => [...prev, created]);
            setForm(emptyForm);
            setFormOpen(false);
        } catch (e) {
            console.error(e);
            setFormErr(e.message || "Create failed");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="w-screen min-h-screen">
                <MerchantBar />
                <div className="h-[70vh] flex items-center justify-center text-[var(--ez-muted)]">
                    Loading…
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center">
            <MerchantBar />
            <div className="p-6 w-full max-w-3xl">
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] mb-2">
                        Merchant
                    </p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ez-ink)]">
                        My Restaurants
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setFormOpen((v) => !v);
                        setFormErr("");
                    }}
                >
                    {formOpen ? "Cancel" : "+ Add restaurant"}
                </button>
            </div>

            {err && <div className="text-red-600 text-sm mb-4 w-full max-w-3xl">{err}</div>}

            {formOpen && (
                <form
                    onSubmit={handleCreate}
                    className="ez-card w-full max-w-3xl rounded-3xl p-5 mb-5 space-y-3"
                >
                    <h2 className="text-lg font-bold">New restaurant</h2>
                    <div>
                        <label>Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => handleField("name", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div>
                        <label>Address</label>
                        <input
                            value={form.address}
                            onChange={(e) => handleField("address", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label>Latitude</label>
                            <input
                                value={form.latitude}
                                onChange={(e) => handleField("latitude", e.target.value)}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label>Longitude</label>
                            <input
                                value={form.longitude}
                                onChange={(e) => handleField("longitude", e.target.value)}
                                disabled={saving}
                            />
                        </div>
                    </div>
                    <div>
                        <label>Google place ID (optional)</label>
                        <input
                            value={form.google_place_id}
                            onChange={(e) => handleField("google_place_id", e.target.value)}
                            disabled={saving}
                            placeholder="Leave blank if you don’t have one"
                        />
                        <p className="text-xs text-[var(--ez-muted)] mt-1">
                            Needed for the customer map to find this place. Blank is fine for menu-only shops; coords default to Seattle.
                        </p>
                    </div>
                    {formErr && <div className="text-xs text-red-600">{formErr}</div>}
                    <div className="flex justify-end">
                        <button type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Create"}
                        </button>
                    </div>
                </form>
            )}

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

                {rests.length === 0 && !formOpen && (
                    <div className="ez-card rounded-3xl text-center text-[var(--ez-muted)] text-sm py-12">
                        You have no restaurants yet. Click “Add restaurant” to create one.
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
