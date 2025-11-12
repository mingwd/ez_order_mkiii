// src/pages/Home.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { apiResolve, apiItems } from "../api/client";
import MapView from "../components/MapView";

export default function Home() {
    const [rests, setRests] = useState([]);
    const [allowedIds, setAllowedIds] = useState([]);
    const [active, setActive] = useState(null);

    const [resolveLoading, setResolveLoading] = useState(false);
    const [resolveErr, setResolveErr] = useState("");
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsErr, setItemsErr] = useState("");
    const [items, setItems] = useState([]);

    const handlePlaceIds = useCallback(async (ids) => {
        try {
            setResolveErr("");
            setResolveLoading(true);
            if (!ids || ids.length === 0) {
                setRests([]);
                setAllowedIds([]);
                return;
            }
            const d = await apiResolve(ids);
            const list = (d && d.restaurants) || [];
            setRests(list);
            setAllowedIds(list.map((r) => r.google_place_id));
        } catch (e) {
            console.error(e);
            setRests([]);
            setAllowedIds([]);
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
        if (r) openMenu(r);
        else console.log("Marker clicked but not in resolved list:", placeId);
    }, []);

    async function openMenu(r) {
        setActive(r);
        setItems([]);
        setItemsErr("");
        setItemsLoading(true);
        try {
            const d = await apiItems(r.id);
            setItems((d && d.items) || []);
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
        <div className="w-screen h-screen overflow-x-hidden bg-gray-50 flex flex-col">
            {/* Header: 20% */}
            <header className="h-[10vh] w-full border-b bg-white">
                <div className="h-full px-6 flex items-center justify-between">
                    {/* 左：Logo 占位 */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-300/70" />
                        <span className="font-semibold text-gray-800">eazy-order</span>
                    </div>
                    {/* 中：Order for me */}
                    <button
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 hover:bg-gray-200 transition text-sm font-medium"
                        onClick={() => alert("TODO: one-click order")}
                    >
                        Order for me
                    </button>
                    {/* 右：用户名占位 */}
                    <div className="text-sm text-gray-700">Guest</div>
                </div>
            </header>

            {/* Main: 60% */}
            <main className="h-[80vh] w-full px-6 py-4">
                <div className="grid grid-cols-12 gap-6 h-full">
                    {/* 左边地图：撑满高度 */}
                    <div className="col-span-8 bg-white rounded-xl border shadow-sm p-0 h-full">
                        <div className="w-full h-full rounded-xl overflow-hidden">
                            <MapView
                                onPlaceIds={handlePlaceIds}
                                onMarkerClick={handleMarkerClick}
                                allowedPlaceIds={allowedIds}
                            />
                        </div>
                    </div>

                    {/* 右侧餐厅列表：撑满高度 + 内部滚动 */}
                    <div className="col-span-4 bg-white rounded-xl border shadow-sm p-4 h-full flex flex-col min-h-0">
                        <h2 className="text-xl font-semibold mb-2 text-gray-800">Nearby Restaurants</h2>

                        {resolveLoading && <div className="text-sm text-gray-500 mb-2">Loading…</div>}
                        {resolveErr && <div className="text-sm text-red-600 mb-2">{resolveErr}</div>}

                        <ul className="space-y-3 overflow-y-auto pr-1 flex-1">
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
                </div>
            </main>

            {/* Footer: 10%（包含购物车区域） */}
            <footer className="h-[10vh] w-full border-t bg-transparent relative">
                {/* 右下角购物车：固定在 footer 内部的右下角 */}
                <div className="absolute right-4 bottom-4 w-80 rounded-2xl border-2 border-gray-300 bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
                    <div className="text-sm font-medium text-gray-700">Cart (coming soon)</div>
                    <div className="text-xs text-gray-500">Your items will appear here.</div>
                </div>
            </footer>

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
