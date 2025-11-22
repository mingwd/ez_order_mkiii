// src/pages/MerchantItemEdit.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    apiMerchantGetItem,
    apiMerchantUpdateItem,
    apiMerchantCreateItem,
    apiMerchantTags,
} from "../api/client";

export default function MerchantItemEdit({ mode }) {
    const navigate = useNavigate();
    const { itemId, restId } = useParams();

    const effectiveMode = mode || (itemId ? "edit" : "create");

    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        is_active: true,
    });

    // 关键：独立存一个 restaurantId，初始值用路由里的 restId（create 模式）
    const [restaurantId, setRestaurantId] = useState(restId || null);

    // tag 选项（从后端拉）
    const [tagOptions, setTagOptions] = useState({
        cuisines: [],
        proteins: [],
        spiciness: [],
        meal_types: [],
        flavors: [],
        allergens: [],
        nutritions: [],
    });

    // 当前 item 选中的 tag id
    const [selectedTags, setSelectedTags] = useState({
        cuisines: [],
        proteins: [],
        meal_types: [],
        flavors: [],
        allergens: [],
        nutritions: [],
        spiciness: null, // 单选
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [title, setTitle] = useState(
        effectiveMode === "edit" ? "Edit item" : "Create new item"
    );

    // 初始化：拉 tag 选项 + 如果是 edit 再拉当前菜品
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError("");

                // 1) 拉所有 tag 选项
                const tags = await apiMerchantTags();
                setTagOptions({
                    cuisines: tags.cuisines || [],
                    proteins: tags.proteins || [],
                    spiciness: tags.spiciness || [],
                    meal_types: tags.meal_types || [],
                    flavors: tags.flavors || [],
                    allergens: tags.allergens || [],
                    nutritions: tags.nutritions || [],
                });

                // 2) 如果是编辑模式，拉 item 详情
                if (effectiveMode === "edit" && itemId) {
                    const data = await apiMerchantGetItem(itemId);
                    setForm({
                        name: data.name || "",
                        description: data.description || "",
                        price:
                            data.price !== null && data.price !== undefined
                                ? String(data.price)
                                : "",
                        is_active: data.is_active ?? true,
                    });
                    setSelectedTags({
                        cuisines: data.cuisines || [],
                        proteins: data.proteins || [],
                        meal_types: data.meal_types || [],
                        flavors: data.flavors || [],
                        allergens: data.allergens || [],
                        nutritions: data.nutritions || [],
                        spiciness: data.spiciness || null,
                    });
                    // 关键：从后端记录这个菜品属于哪家餐厅
                    // 假设接口返回的是 restaurant 的 id
                    setRestaurantId(String(data.restaurant));
                    setTitle(`Edit: ${data.name || "Item"}`);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load initial data.");
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

    // 多选 tag：点击切换选中 / 取消
    function toggleTag(group, id) {
        setSelectedTags((prev) => {
            const current = prev[group] || [];
            const exists = current.includes(id);
            return {
                ...prev,
                [group]: exists
                    ? current.filter((x) => x !== id)
                    : [...current, id],
            };
        });
    }

    function tagButtonClass(selected) {
        const base =
            "px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer";
        if (selected) {
            return (
                base +
                " bg-blue-500 border-blue-500 text-white shadow-sm"
            );
        }
        return (
            base +
            " bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
        );
    }

    // spiciness 单选：再次点击可取消
    function toggleSpiciness(id) {
        setSelectedTags((prev) => ({
            ...prev,
            spiciness: prev.spiciness === id ? null : id,
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
            price: form.price,
            is_active: form.is_active,

            // 把选中的 tag id 一起提交给后端
            cuisines: selectedTags.cuisines,
            proteins: selectedTags.proteins,
            meal_types: selectedTags.meal_types,
            flavors: selectedTags.flavors,
            allergens: selectedTags.allergens,
            nutritions: selectedTags.nutritions,
            spiciness: selectedTags.spiciness,
        };

        try {
            setSaving(true);
            if (effectiveMode === "edit") {
                await apiMerchantUpdateItem(itemId, payload);
            } else {
                if (!restId) {
                    setError("Missing restaurant id in URL.");
                    return;
                }
                await apiMerchantCreateItem(restId, payload);
            }

            // ✅ 成功后统一用 restaurantId 跳转菜单页
            if (restaurantId) {
                navigate(`/merchant/restaurants/${restaurantId}/menu`);
            } else {
                // 实在拿不到就退回餐厅列表
                navigate("/merchant/restaurants");
            }
        } catch (err) {
            console.error(err);
            setError(
                effectiveMode === "edit"
                    ? "Update failed."
                    : "Create failed."
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
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-md border p-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                    {title}
                </h1>
                <p className="text-xs text-gray-500 mb-4">
                    {effectiveMode === "edit"
                        ? "Edit menu item information and tags."
                        : "Create a new menu item for this restaurant."}
                </p>

                {error && (
                    <div className="mb-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 基础信息 */}
                    <div className="space-y-4">
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
                                    handleFieldChange(
                                        "description",
                                        e.target.value
                                    )
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
                                        handleFieldChange(
                                            "price",
                                            e.target.value
                                        )
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
                                        handleFieldChange(
                                            "is_active",
                                            e.target.checked
                                        )
                                    }
                                    disabled={saving}
                                />
                                Active
                            </label>
                        </div>
                    </div>

                    {/* Tag 选择区域 */}
                    <div className="border-t pt-4 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-800">
                            Tags
                        </h2>

                        <TagGroup
                            title="Cuisine"
                            options={tagOptions.cuisines}
                            selected={selectedTags.cuisines}
                            onToggle={(id) => toggleTag("cuisines", id)}
                        />

                        <TagGroup
                            title="Protein"
                            options={tagOptions.proteins}
                            selected={selectedTags.proteins}
                            onToggle={(id) => toggleTag("proteins", id)}
                        />

                        <TagGroupSingle
                            title="Spiciness"
                            options={tagOptions.spiciness}
                            selectedId={selectedTags.spiciness}
                            onSelect={toggleSpiciness}
                        />

                        <TagGroup
                            title="Meal type"
                            options={tagOptions.meal_types}
                            selected={selectedTags.meal_types}
                            onToggle={(id) => toggleTag("meal_types", id)}
                        />

                        <TagGroup
                            title="Flavor"
                            options={tagOptions.flavors}
                            selected={selectedTags.flavors}
                            onToggle={(id) => toggleTag("flavors", id)}
                        />

                        <TagGroup
                            title="Allergens (present in this dish)"
                            options={tagOptions.allergens}
                            selected={selectedTags.allergens}
                            onToggle={(id) => toggleTag("allergens", id)}
                        />

                        <TagGroup
                            title="Nutrition"
                            options={tagOptions.nutritions}
                            selected={selectedTags.nutritions}
                            onToggle={(id) => toggleTag("nutritions", id)}
                        />
                    </div>

                    {/* 按钮 */}
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

/**
 * 多选 tag 的小组件
 */
function TagGroup({ title, options, selected, onToggle }) {
    if (!options || options.length === 0) return null;

    return (
        <div>
            <div className="text-xs font-medium text-gray-700 mb-1">
                {title}
            </div>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                    const active = selected.includes(opt.id);
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onToggle(opt.id)}
                            className={
                                "px-2 py-1 rounded-full border text-xs " +
                                (active
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200")
                            }
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * 单选 tag（spiciness）
 */
function TagGroupSingle({ title, options, selectedId, onSelect }) {
    if (!options || options.length === 0) return null;

    return (
        <div>
            <div className="text-xs font-medium text-gray-700 mb-1">
                {title}
            </div>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                    const active = selectedId === opt.id;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onSelect(opt.id)}
                            className={
                                "px-2 py-1 rounded-full border text-xs " +
                                (active
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200")
                            }
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}