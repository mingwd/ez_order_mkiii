// src/pages/Home.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { apiResolve, apiItems } from "../api/client";
import MapView from "../components/MapView";

export default function Home() {
    const [rests, setRests] = useState([]);
    const [active, setActive] = useState(null);

    // 分离的加载与错误
    const [resolveLoading, setResolveLoading] = useState(false);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [resolveErr, setResolveErr] = useState("");
    const [itemsErr, setItemsErr] = useState("");

    const [items, setItems] = useState([]);

    // Map 回调：拿到 place_ids → 调后端 resolve
    const handlePlaceIds = useCallback(async (ids) => {
        try {
            setResolveErr("");
            setResolveLoading(true);
            const d = await apiResolve(ids);
            setRests(d.restaurants || []);
        } catch (e) {
            console.error(e);
            setRests([]);
            setResolveErr("Resolve failed.");
        } finally {
            setResolveLoading(false);
        }
    }, []);

    const restsRef = useRef(rests);
    useEffect(() => {
        restsRef.current = rests;
    }, [rests]);

    const handleMarkerClick = useCallback((placeId) => {
        const r =
            restsRef.current.find(
                (x) =>
                    x.google_place_id === placeId ||
                    x.place_id === placeId ||
                    x.placeId === placeId ||
                    x.googlePlaceId === placeId
            ) || null;

        if (r) {
            openMenu(r);
        } else {
            // 轻提示可选
            // setResolveErr("This place is not supported yet.");
            console.log("Marker clicked but not in resolved list:", placeId);
        }
    }, []);

    useEffect(() => {
        // 初始不再调用 apiResolve，等待 MapView 给 ids
    }, []);

    async function openMenu(r) {
        setActive(r);
        setItems([]);
        setItemsErr("");
        setItemsLoading(true);
        try {
            const d = await apiItems(r.id);
            setItems(d.items || []);
        } catch (e) {
            console.error(e);
            setItemsErr("Failed to load menu.");
        } finally {
            setItemsLoading(false);
        }
    }

    function closeModal() {
        setActive(null);
        setItems([]);
        setItemsErr("");
    }

    return (
        <div className="min-h-screen p-6 grid grid-cols-12 gap-6 bg-gray-50">
            {/* 左边地图 */}
            <div className="col-span-8 bg-white rounded-xl border shadow-sm p-0 h-[480px]">
                <MapView onPlaceIds={handlePlaceIds} onMarkerClick={handleMarkerClick} />
            </div>

            {/* 右侧餐厅列表 */}
            <div className="col-span-4 bg-white rounded-xl border shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">Nearby Restaurants</h2>

                {resolveLoading && <div className="text-sm text-gray-500 mb-2">Loading…</div>}
                {resolveErr && <div className="text-sm text-red-600 mb-2">{resolveErr}</div>}

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
                    {!resolveLoading && rests.length === 0 && (
                        <li className="text-sm text-gray-500">No supported restaurants nearby.</li>
                    )}
                </ul>
            </div>

            {/* 菜单弹窗 */}
            {active && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeModal}
                            className="absolute right-4 top-4 text-gray-500 hover:text-black text-xl leading-none"
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <h3 className="text-lg font-semibold text-gray-800">{active.name}</h3>
                        {active.address && <p className="text-sm text-gray-500 mb-3">{active.address}</p>}

                        {itemsLoading && <div className="text-sm text-gray-500">Loading menu…</div>}
                        {itemsErr && !itemsLoading && <div className="text-sm text-red-600">{itemsErr}</div>}

                        {!itemsLoading && !itemsErr && (
                            <div className="max-h-80 overflow-y-auto divide-y">
                                {items.length === 0 ? (
                                    <div className="text-sm text-gray-500 py-4">No items.</div>
                                ) : (
                                    items.map((it) => (
                                        <div key={it.id} className="flex items-start justify-between py-3">
                                            <div>
                                                <div className="font-medium text-gray-800">{it.name}</div>
                                                {it.description && (
                                                    <div className="text-xs text-gray-500">{it.description}</div>
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
