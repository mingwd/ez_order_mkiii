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

    // 记录“本次编辑中点击过要 mute 的 tag”
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
                // 每次加载 profile，重置本地 muted 状态
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
            const set = new Set(prev[type]); // 拷贝一个新 Set 触发重渲染
            if (set.has(id)) {
                set.delete(id); // 再次点击就恢复（不再 mute）
            } else {
                set.add(id);    // 第一次点击 → 标记为 mute
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

                // 这些数组告诉后端：本次哪些 tag 要把 score 置 0
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

            // 保存成功后，清空本次编辑的 mute 状态
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
            <div className="w-screen h-screen flex items-center justify-center">
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
        "inline-flex items-center rounded-full border px-3 py-1 text-xs mr-2 mb-2 cursor-pointer transition";
    const pillActive =
        "bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200";
    const pillMuted =
        "bg-gray-100 border-gray-300 text-gray-400 line-through hover:bg-gray-100";

    return (
        <div className="w-screen min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            {/* 顶部信息卡片 */}
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-md p-6 mb-6 border">
                <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Customer information & preferences
                </p>

                <div className="mt-4 space-y-2 text-sm text-gray-900">
                    <div>
                        <strong className="text-gray-700">Username:</strong>{" "}
                        {data.username}
                    </div>
                    <div>
                        <strong className="text-gray-700">User Type:</strong>{" "}
                        {data.user_type || "customer"}
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSave}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl"
            >
                {/* 左侧：基础信息 */}
                <div className="bg-white rounded-xl shadow-md p-6 border space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">Basic</h2>

                    <div className="space-y-2 text-sm">
                        <div className="text-gray-900">
                            <label className="block text-xs text-gray-600 mb-1">
                                Height (cm)
                            </label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
                                value={data.height_cm ?? ""}
                                onChange={(e) =>
                                    handleFieldChange("height_cm", e.target.value)
                                }
                            />
                        </div>

                        <div className="text-gray-900">
                            <label className="block text-xs text-gray-600 mb-1">
                                Weight (kg)
                            </label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
                                value={data.weight_kg ?? ""}
                                onChange={(e) =>
                                    handleFieldChange("weight_kg", e.target.value)
                                }
                            />
                        </div>

                        <div className="text-gray-900">
                            <label className="block text-xs text-gray-600 mb-1">
                                Age
                            </label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
                                value={data.age ?? ""}
                                onChange={(e) =>
                                    handleFieldChange("age", e.target.value)
                                }
                            />
                        </div>

                        <div className="text-gray-900">
                            <label className="block text-xs text-gray-600 mb-1">
                                Gender
                            </label>
                            <select
                                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
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

                        <div className="text-gray-900">
                            <label className="block text-xs text-gray-600 mb-1">
                                Activity Level
                            </label>
                            <select
                                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
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

                        <div className="text-xs text-gray-500">
                            BMR (calculated later): {data.bmr ?? "—"}
                        </div>
                    </div>
                </div>

                {/* 右侧：Memo */}
                <div className="bg-white rounded-xl shadow-md p-6 border space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">Memo</h2>
                    <p className="text-xs text-gray-500">
                        Diet notes / restrictions / anything you want the AI to know.
                    </p>
                    <textarea
                        className="text-gray-900 w-full min-h-[160px] border rounded-lg px-3 py-2 text-sm"
                        value={data.memo ?? ""}
                        onChange={(e) => handleFieldChange("memo", e.target.value)}
                    />
                </div>

                {/* 偏好标签：点击 → 本地变灰，Save → score 置 0 */}
                <div className="bg-white rounded-xl shadow-md p-6 border md:col-span-2 space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Preferences (click to mute)
                    </h2>
                    <p className="text-xs text-gray-500 mb-1">
                        These are tags the system has learned from your past orders.
                        Click a tag to tell the AI “I don&apos;t like this anymore”
                        — it will be muted (score = 0) after you save.
                    </p>

                    {/* 每一类只展示“有的” */}
                    {prefs.cuisines?.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-gray-600 mb-1">
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
                            <div className="text-xs font-semibold text-gray-600 mb-1">
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
                            <div className="text-xs font-semibold text-gray-600 mb-1">
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
                            <div className="text-xs font-semibold text-gray-600 mb-1">
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
                            <div className="text-xs font-semibold text-gray-600 mb-1">
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
                            <div className="text-xs font-semibold text-gray-600 mb-1">
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
                            <div className="text-xs font-semibold text-gray-600 mb-1">
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
                            <div className="text-xs text-gray-500 italic">
                                No learned preferences yet.
                                Once you place some orders, tags will appear here.
                            </div>
                        )}
                </div>

                {/* 底部按钮 */}
                <div className="md:col-span-2 flex justify-between items-center mt-2">
                    <div className="text-xs text-red-600">{error}</div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition text-sm"
                            onClick={() => nav("/")}
                            disabled={saving}
                        >
                            Back to home
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm"
                            onClick={handleLogout}
                            disabled={saving}
                        >
                            Logout
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800 disabled:opacity-60"
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