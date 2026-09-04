// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { apiGetProfile, apiUpdateProfile } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const nav = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // tags to mute”
    const [muted, setMuted] = useState({
        cuisines: new Set(),
        flavors: new Set(),
        nutritions: new Set(),
        proteins: new Set(),
        spices: new Set(),
        meal_types: new Set(),
        allergens: new Set(),
    });

    useEffect(() => {
        (async () => {
            try {
                const d = await apiGetProfile();
                setData(d);
                // reset muted tags on load
                setMuted({
                    cuisines: new Set(),
                    flavors: new Set(),
                    nutritions: new Set(),
                    proteins: new Set(),
                    spices: new Set(),
                    meal_types: new Set(),
                    allergens: new Set(),
                });
            } catch {
                nav("/auth");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function handleFieldChange(field, value) {
        setData((prev) => ({ ...prev, [field]: value }));
    }

    function toggleTag(type, id) {
        setMuted((prev) => {
            const next = { ...prev };
            const set = new Set(prev[type]); // re-rendre
            if (set.has(id)) {
                set.delete(id); // unmute on second click
            } else {
                set.add(id);    // first click → mute
            }
            next[type] = set;
            return next;
        });
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!data) return;
        try {
            setSaving(true);
            setError("");

            const payload = {
                height_cm: data.height_cm,
                weight_kg: data.weight_kg,
                age: data.age,
                gender: data.gender,
                activity_level: data.activity_level,
                memo: data.memo,

                // tag score reset
                muted_cuisine_ids: Array.from(muted.cuisines),
                muted_flavor_ids: Array.from(muted.flavors),
                muted_nutrition_ids: Array.from(muted.nutritions),
                muted_protein_ids: Array.from(muted.proteins),
                muted_spice_ids: Array.from(muted.spices),
                muted_meal_type_ids: Array.from(muted.meal_types),
                muted_allergen_ids: Array.from(muted.allergens),
            };

            const updated = await apiUpdateProfile(payload);
            setData(updated);

            // clear muted tags after save
            setMuted({
                cuisines: new Set(),
                flavors: new Set(),
                nutritions: new Set(),
                proteins: new Set(),
                spices: new Set(),
                meal_types: new Set(),
                allergens: new Set(),
            });
        } catch (err) {
            console.error(err);
            setError("Update failed");
        } finally {
            setSaving(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        nav("/");
    }

    if (loading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center text-[var(--ez-muted)]">
                Loading…
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-screen h-screen flex items-center justify-center">
                Redirecting…
            </div>
        );
    }

    const prefs = data.prefs || {
        cuisines: [],
        flavors: [],
        nutritions: [],
        proteins: [],
        spices: [],
        meal_types: [],
        allergens: [],
    };

    const pillBase =
        "btn-chip mr-2 mb-2 border";
    const pillActive =
        "bg-[#fff4ec] border-[#ffd7bf] text-[var(--ez-primary)] hover:bg-[#ffe8d6]";
    const pillMuted =
        "bg-[#f3f3f3] border-transparent text-[var(--ez-muted)] line-through hover:bg-[#e8e8e8]";

    return (
        <div className="w-screen min-h-screen p-6 flex flex-col items-center">
            <div className="ez-card w-full max-w-3xl rounded-3xl p-6 mb-5">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] mb-2">
                    Account
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ez-ink)]">Profile</h1>
                <p className="text-sm text-[var(--ez-muted)] mt-1">
                    Bio information & preferences
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-[var(--ez-bg)] px-4 py-3">
                        <div className="text-xs text-[var(--ez-muted)] mb-0.5">Username</div>
                        <div className="font-semibold">{data.username}</div>
                    </div>
                    <div className="rounded-xl bg-[var(--ez-bg)] px-4 py-3">
                        <div className="text-xs text-[var(--ez-muted)] mb-0.5">User type</div>
                        <div className="font-semibold">{data.user_type}</div>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSave}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl"
            >
                <div className="ez-card rounded-3xl p-6 space-y-3">
                    <h2 className="text-lg font-bold text-[var(--ez-ink)]">Basic</h2>

                    <div className="space-y-3 text-sm">
                        <div>
                            <label>
                                Height (cm)
                            </label>
                            <input
                                className="w-full"
                                value={data.height_cm ?? ""}
                                onChange={(e) =>
                                    handleFieldChange("height_cm", e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>
                                Weight (kg)
                            </label>
                            <input
                                className="w-full"
                                value={data.weight_kg ?? ""}
                                onChange={(e) =>
                                    handleFieldChange("weight_kg", e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>
                                Age
                            </label>
                            <input
                                className="w-full"
                                value={data.age ?? ""}
                                onChange={(e) =>
                                    handleFieldChange("age", e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>
                                Gender
                            </label>
                            <select
                                className="w-full"
                                value={data.gender ?? ""}
                                onChange={(e) =>
                                    handleFieldChange("gender", e.target.value)
                                }
                            >
                                <option value="">Select…</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label>
                                Activity Level
                            </label>
                            <select
                                className="w-full"
                                value={data.activity_level ?? ""}
                                onChange={(e) =>
                                    handleFieldChange("activity_level", e.target.value)
                                }
                            >
                                <option value="">-- select --</option>
                                <option value="sedentary">Sedentary / office</option>
                                <option value="light">Lightly active</option>
                                <option value="active">Active</option>
                                <option value="athlete">Athlete</option>
                            </select>
                        </div>

                        <div className="text-xs text-[var(--ez-muted)]">
                            BMR (calculated): {data.bmr ?? "—"}
                        </div>
                    </div>
                </div>

                <div className="ez-card rounded-3xl p-6 space-y-3">
                    <h2 className="text-lg font-bold text-[var(--ez-ink)]">Memo</h2>
                    <p className="text-xs text-[var(--ez-muted)]">
                        Diet notes / restrictions / anything you want the AI to know.
                    </p>
                    <textarea
                        className="min-h-[160px]"
                        value={data.memo ?? ""}
                        onChange={(e) => handleFieldChange("memo", e.target.value)}
                    />
                </div>

                <div className="ez-card rounded-3xl p-6 md:col-span-2 space-y-3">
                    <h2 className="text-lg font-bold text-[var(--ez-ink)]">
                        Preferences (click to mute)
                    </h2>
                    <p className="text-xs text-[var(--ez-muted)] mb-1">
                        These are tags the system has learned from your past orders.
                        Click a tag to tell the AI “I don&apos;t like this anymore”
                        — it will be muted (score = 0) after you save.
                    </p>

                    {/* only show existing tags */}
                    {prefs.cuisines?.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1">
                                Cuisine
                            </div>
                            <div>
                                {prefs.cuisines.map((t) => {
                                    const isMuted = muted.cuisines.has(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`${pillBase} ${isMuted ? pillMuted : pillActive
                                                }`}
                                            onClick={() =>
                                                toggleTag("cuisines", t.id)
                                            }
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {prefs.flavors?.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1">
                                Flavor
                            </div>
                            <div>
                                {prefs.flavors.map((t) => {
                                    const isMuted = muted.flavors.has(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`${pillBase} ${isMuted ? pillMuted : pillActive
                                                }`}
                                            onClick={() =>
                                                toggleTag("flavors", t.id)
                                            }
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {prefs.nutritions?.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1">
                                Nutrition
                            </div>
                            <div>
                                {prefs.nutritions.map((t) => {
                                    const isMuted = muted.nutritions.has(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`${pillBase} ${isMuted ? pillMuted : pillActive
                                                }`}
                                            onClick={() =>
                                                toggleTag("nutritions", t.id)
                                            }
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {prefs.proteins?.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1">
                                Protein
                            </div>
                            <div>
                                {prefs.proteins.map((t) => {
                                    const isMuted = muted.proteins.has(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`${pillBase} ${isMuted ? pillMuted : pillActive
                                                }`}
                                            onClick={() =>
                                                toggleTag("proteins", t.id)
                                            }
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {prefs.spices?.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1">
                                Spiciness
                            </div>
                            <div>
                                {prefs.spices.map((t) => {
                                    const isMuted = muted.spices.has(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`${pillBase} ${isMuted ? pillMuted : pillActive
                                                }`}
                                            onClick={() =>
                                                toggleTag("spices", t.id)
                                            }
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {prefs.meal_types?.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1">
                                Meal type
                            </div>
                            <div>
                                {prefs.meal_types.map((t) => {
                                    const isMuted = muted.meal_types.has(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`${pillBase} ${isMuted ? pillMuted : pillActive
                                                }`}
                                            onClick={() =>
                                                toggleTag("meal_types", t.id)
                                            }
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {prefs.allergens?.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1">
                                Allergens (learned)
                            </div>
                            <div>
                                {prefs.allergens.map((t) => {
                                    const isMuted = muted.allergens.has(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`${pillBase} ${isMuted ? pillMuted : pillActive
                                                }`}
                                            onClick={() =>
                                                toggleTag("allergens", t.id)
                                            }
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {(!prefs.cuisines?.length &&
                        !prefs.flavors?.length &&
                        !prefs.nutritions?.length &&
                        !prefs.proteins?.length &&
                        !prefs.spices?.length &&
                        !prefs.meal_types?.length &&
                        !prefs.allergens?.length) && (
                            <div className="text-xs text-[var(--ez-muted)] italic">
                                No learned preferences yet.
                                Once you place some orders, tags will appear here.
                            </div>
                        )}
                </div>

                <div className="md:col-span-2 flex justify-between items-center mt-1 pb-4">
                    <div className="text-xs text-red-600">{error}</div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => nav("/")}
                            disabled={saving}
                        >
                            Back to home
                        </button>
                        <button
                            type="button"
                            className="btn-danger"
                            onClick={handleLogout}
                            disabled={saving}
                        >
                            Logout
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}