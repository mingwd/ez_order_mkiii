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

    useEffect(() => {
        (async () => {
            try {
                const d = await apiGetProfile();
                setData(d);
            } catch {
                // 如果没登录，跳去 /auth
                nav("/auth");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function handleFieldChange(field, value) {
        setData((prev) => ({ ...prev, [field]: value }));
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
            };
            const updated = await apiUpdateProfile(payload);
            setData(updated);
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

    return (
        <div className="w-screen min-h-screen bg-gray-50 p-6 flex flex-col items-center">
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
                                className="w-full border rounded-lg px-3 py-2 text-sm"
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
                                className="w-full border rounded-lg px-3 py-2 text-sm"
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
                                className="w-full border rounded-lg px-3 py-2 text-sm"
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
                                className="w-full border rounded-lg px-3 py-2 text-sm"
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
                                className="w-full border rounded-lg px-3 py-2 text-sm"
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