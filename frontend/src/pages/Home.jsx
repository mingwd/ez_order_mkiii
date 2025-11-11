import { useEffect, useState } from "react";
import { apiResolve, apiItems } from "../api/client";

export default function Home() {
    const [rests, setRests] = useState([]);
    const [active, setActive] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        apiResolve(["ChIJ-demo-001"])
            .then((d) => setRests(d.restaurants || []))
            .catch((e) => console.error(e));
    }, []);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && closeModal();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [active]);

    async function openMenu(r) {
        setActive(r);
        setLoading(true);
        setErr("");
        setItems([]);
        try {
            const d = await apiItems(r.id);
            setItems(d.items || []);
        } catch (e) {
            console.error(e);
            setErr("Failed to load menu.");
        } finally {
            setLoading(false);
        }
    }

    function closeModal() {
        setActive(null);
        setItems([]);
        setErr("");
    }

    return (
        <div className="min-h-screen p-6 grid grid-cols-12 gap-6 bg-gray-50">
            {/* 左侧地图占位 */}
            <div className="col-span-8 bg-white rounded-xl border flex items-center justify-center shadow-sm">
                <span className="text-gray-400">Map placeholder</span>
            </div>

            {/* 右侧餐厅列表 */}
            <div className="col-span-4 bg-white rounded-xl border shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Nearby Restaurants</h2>
                <ul className="space-y-3">
                    {rests.map((r) => (
                        <li
                            key={r.id}
                            onClick={() => openMenu(r)}
                            className="border rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition"
                        >
                            <div className="font-medium text-gray-800">{r.name}</div>
                            <div className="text-sm text-gray-500">{r.address}</div>
                        </li>
                    ))}
                    {rests.length === 0 && (
                        <li className="text-sm text-gray-500">No restaurants found.</li>
                    )}
                </ul>
            </div>

            {/* 弹出菜单卡片 */}
            {active && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 关闭按钮 */}
                        <button
                            onClick={closeModal}
                            className="absolute right-4 top-4 text-gray-500 hover:text-black text-xl leading-none"
                            aria-label="Close"
                        >
                            ×
                        </button>

                        {/* 餐厅标题 */}
                        <h3 className="text-lg font-semibold text-gray-800">{active.name}</h3>
                        {active.address && (
                            <p className="text-sm text-gray-500 mb-3">{active.address}</p>
                        )}

                        {/* 内容 */}
                        {loading && <div className="text-sm text-gray-500">Loading menu…</div>}
                        {err && !loading && <div className="text-sm text-red-600">{err}</div>}

                        {!loading && !err && (
                            <div className="max-h-80 overflow-y-auto divide-y">
                                {items.length === 0 ? (
                                    <div className="text-sm text-gray-500 py-4">No items.</div>
                                ) : (
                                    items.map((it) => (
                                        <div
                                            key={it.id}
                                            className="flex items-start justify-between py-3"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-800">{it.name}</div>
                                                {it.description && (
                                                    <div className="text-xs text-gray-500">
                                                        {it.description}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-3 font-mono text-gray-700">
                                                ${Number(it.price).toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 底部关闭 */}
                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm text-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
