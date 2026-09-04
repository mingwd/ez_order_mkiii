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
            "btn-chip border";
        if (selected) {
            return (
                base +
                " bg-[var(--ez-primary)] border-[var(--ez-primary)] text-white"
            );
        }
        return (
            base +
            " bg-white/80 border-[var(--ez-line)] text-[var(--ez-ink)] hover:border-[rgba(255,106,26,0.4)]"
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
            <div className="w-screen h-screen flex items-center justify-center text-[var(--ez-muted)]">
                Loading…
            </div>
        );
    }

    return (
        <div className="w-screen min-h-screen flex justify-center p-6">
            <div className="w-full max-w-3xl ez-card rounded-3xl p-7">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] mb-2">
                    {effectiveMode === "edit" ? "Edit item" : "New item"}
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ez-ink)] mb-2">
                    {title}
                </h1>
                <p className="text-sm text-[var(--ez-muted)] mb-5">
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
                    <div className="space-y-4">
                        <div>
                            <label>
                                Name
                            </label>
                            <input
                                className="w-full"
                                value={form.name}
                                onChange={(e) =>
                                    handleFieldChange("name", e.target.value)
                                }
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label>
                                Description
                            </label>
                            <textarea
                                className="min-h-[80px]"
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
                                <label>
                                    Price ($)
                                </label>
                                <input
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

                            <label className="flex items-center gap-2 mt-5 text-sm text-[var(--ez-ink)] font-medium">
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

                    {/* Tag Select */}
                    <div className="border-t border-[var(--ez-line)] pt-5 space-y-4">
                        <h2 className="text-sm font-bold text-[var(--ez-ink)]">
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
                            className="btn-ghost"
                            onClick={() => navigate(-1)}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
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
            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1.5">
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
                                "btn-chip border " +
                                (active
                                    ? "bg-[var(--ez-primary)] border-[var(--ez-primary)] text-white"
                                    : "bg-white/80 border-[var(--ez-line)] text-[var(--ez-ink)]")
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
            <div className="text-xs font-semibold text-[var(--ez-muted)] mb-1.5">
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
                                "btn-chip border " +
                                (active
                                    ? "bg-[var(--ez-primary)] border-[var(--ez-primary)] text-white"
                                    : "bg-white/80 border-[var(--ez-line)] text-[var(--ez-ink)]")
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