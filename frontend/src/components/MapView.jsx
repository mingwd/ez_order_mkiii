// src/components/MapView.jsx
import { useEffect, useRef, useState } from "react";

export default function MapView({ onPlaceIds, onMarkerClick, allowedPlaceIds = [] }) {
    const ref = useRef(null);
    const restMarkersRef = useRef([]);     // 仅餐厅 pins
    const youMarkerRef = useRef(null);     // 自己位置 pin
    const resultsRef = useRef([]);         // 保存 searchNearby 的原始结果
    const cbRef = useRef(onMarkerClick);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);

    useEffect(() => { cbRef.current = onMarkerClick; }, [onMarkerClick]);

    // 初始化地图 + nearby 搜索（不画餐厅 pin）
    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                const { Map } = await google.maps.importLibrary("maps");
                const { Place } = await google.maps.importLibrary("places");
                const { AdvancedMarkerElement: Marker } = await google.maps.importLibrary("marker");

                const pos = await new Promise((resolve) => {
                    if (!navigator.geolocation) return resolve({ lat: 47.6097, lng: -122.3331 });
                    navigator.geolocation.getCurrentPosition(
                        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
                        () => resolve({ lat: 47.6097, lng: -122.3331 }),
                        { enableHighAccuracy: true, timeout: 3000 }
                    );
                });
                if (cancelled) return;

                const map = new Map(ref.current, { center: pos, zoom: 13, mapId: "dfc9387e2257609b80304c82" });
                mapRef.current = map;

                // 当前位置 pin
                const userIcon = document.createElement("img");
                userIcon.src = "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png";
                userIcon.style.width = "20px";
                userIcon.style.height = "20px";
                const you = new Marker({ map, position: pos, title: "You are here", content: userIcon });
                youMarkerRef.current = you;

                // Nearby 搜索
                const req = {
                    fields: ["id", "displayName", "location"],
                    locationRestriction: { center: pos, radius: 2000 },
                    includedPrimaryTypes: ["restaurant"],
                };
                const resp = await Place.searchNearby(req);
                const results = resp?.places || [];
                if (cancelled) return;

                resultsRef.current = results;
                const ids = results.map((p) => p.id).filter(Boolean);
                onPlaceIds?.(ids);   // 交给上层去 /resolve

                setLoading(false);
            } catch (e) {
                console.error(e);
                setErr(`Map init or Nearby Search failed: ${e?.message || e}`);
                setLoading(false);
            }
        }

        init();
        return () => {
            cancelled = true;
            // 清理
            restMarkersRef.current.forEach((m) => (m.map = null));
            restMarkersRef.current = [];
            if (youMarkerRef.current) youMarkerRef.current.map = null;
            youMarkerRef.current = null;
            mapRef.current = null;
        };
    }, [onPlaceIds]);

    // 根据 allowedPlaceIds 绘制/更新餐厅 pins（只画数据库存在的）
    useEffect(() => {
        const { AdvancedMarkerElement: Marker } = google.maps.marker || {};
        const map = mapRef.current;
        if (!map || !Marker) return;

        // 清理旧的餐厅 pins
        restMarkersRef.current.forEach((m) => (m.map = null));
        restMarkersRef.current = [];

        if (!allowedPlaceIds || allowedPlaceIds.length === 0) return;

        const allowed = new Set(allowedPlaceIds);

        resultsRef.current.forEach((p) => {
            if (!p.location || !allowed.has(p.id)) return;
            const icon = document.createElement("img");
            icon.src = "https://maps.gstatic.com/mapfiles/ms2/micons/orange-dot.png";
            icon.style.width = "18px";
            icon.style.height = "18px";

            const m = new Marker({
                map,
                position: p.location,
                title: p.displayName?.text || "Unnamed",
                content: icon,
                gmpClickable: true,
            });
            m.addListener("gmp-click", () => cbRef.current?.(p.id));
            restMarkersRef.current.push(m);
        });
    }, [allowedPlaceIds]);

    return (
        <div className="relative w-full h-full">
            <div ref={ref} className="w-full h-full rounded-xl" />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600 bg-white/60 rounded-xl">
                    Loading map…
                </div>
            )}
            {err && (
                <div className="absolute left-2 top-2 text-xs px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded">
                    {err}
                </div>
            )}
        </div>
    );
}
