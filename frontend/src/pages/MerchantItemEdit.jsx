// src/pages/MerchantItemEdit.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    apiMerchantGetItem,
    apiMerchantUpdateItem,
    apiMerchantCreateItem,
} from "../api/client";

export default function MerchantItemEdit({ mode }) {
    const navigate = useNavigate();
    const { itemId, restId } = useParams();

    // 如果没传 mode，就根据 url 是否有 itemId 来判断
    const effectiveMode = mode || (itemId ? "edit" : "create");

    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        is_active: true,
    });

    // 关键：编辑模式下，从接口拿 restaurantId，用来跳转 menu 页
    const [restaurantId, setRestaurantId] = useState(restId || null);

    const [loading, setLoading] = useState(effectiveMode === "edit");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [title, setTitle] = useState(
        effectiveMode === "edit" ? "Edit item" : "Create new item"
    );

    // 编辑模式：加载已有数据
    useEffect(() => {
        if (effectiveMode !== "edit") return;
        if (!itemId) return;

        (async () => {
            try {
                setLoading(true);
                setError("");

                // ⭐ 用专门的单条 item 接口，而不是 items 列表
                const data = await apiMerchantGetItem(itemId);

                setForm({
                    name: data.name || "",
                    description: data.description || "",
                    price: data.price != null ? String(data.price) : "",
                    is_active: data.is_active ?? true,
                });

                // 重点：记录这个 item 属于哪个 restaurant
                setRestaurantId(String(data.restaurant));

                setTitle(`Edit: ${data.name || "Item"}`);
            } catch (err) {
                console.error(err);
                setError("Failed to load item.");
            } finally {
                setLoading(false);
            }
        })();
    }, [effectiveMode, itemId]);

    function handleFieldChange(field, value) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!form.name || !form.price) {
            setError("Name and price are required.");
            return;
        }

        const priceNum = Number(form.price);
        if (Number.isNaN(priceNum) || priceNum < 0) {
            setError("Price must be a non-negative number.");
            return;
        }

        const payload = {
            name: form.name,
            description: form.description,
            price: form.price, // 后端 Decimal 会自己解析 string
            is_active: form.is_active,
            // 以后这里加 tag id 列表
        };

        try {
            setSaving(true);

            if (effectiveMode === "edit") {
                await apiMerchantUpdateItem(itemId, payload);

                // ⭐ 跳回：/merchant/restaurants/:restId/menu
                const targetRestId = restaurantId || restId;
                navigate(`/merchant/restaurants/${targetRestId}/menu`);
            } else {
                if (!restId) {
                    setError("Missing restaurant id in URL.");
                    return;
                }
                await apiMerchantCreateItem(restId, payload);

                // ⭐ 新建完也跳到 menu 页
                navigate(`/merchant/restaurants/${restId}/menu`);
            }
        } catch (err) {
            console.error(err);
            setError(
                effectiveMode === "edit" ? "Update failed." : "Create failed."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center">
                Loading…
            </div>
        );
    }

    return (
        <div className="w-screen min-h-screen bg-gray-50 flex justify-center p-6">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-md border p-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                    {title}
                </h1>
                <p className="text-xs text-gray-500 mb-4">
                    {effectiveMode === "edit"
                        ? "Edit menu item information."
                        : "Create a new menu item for this restaurant."}
                </p>

                {error && (
                    <div className="mb-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            Name
                        </label>
                        <input
                            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                            value={form.name}
                            onChange={(e) =>
                                handleFieldChange("name", e.target.value)
                            }
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            Description
                        </label>
                        <textarea
                            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300 min-h-[80px]"
                            value={form.description}
                            onChange={(e) =>
                                handleFieldChange("description", e.target.value)
                            }
                            disabled={saving}
                        />
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">
                                Price ($)
                            </label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                                value={form.price}
                                onChange={(e) =>
                                    handleFieldChange("price", e.target.value)
                                }
                                disabled={saving}
                            />
                        </div>

                        <label className="flex items-center gap-2 mt-5 text-sm text-gray-800">
                            <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={form.is_active}
                                onChange={(e) =>
                                    handleFieldChange("is_active", e.target.checked)
                                }
                                disabled={saving}
                            />
                            Active
                        </label>
                    </div>

                    <div className="mt-4 flex justify-between">
                        <button
                            type="button"
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm"
                            onClick={() => navigate(-1)}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving…"
                                : effectiveMode === "edit"
                                    ? "Save changes"
                                    : "Create item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}