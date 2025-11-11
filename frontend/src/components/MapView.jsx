// src/components/MapView.jsx
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

export default function MapView({ onPlaceIds }) {
    const ref = useRef(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let map, marker, placesService;
        let cancelled = false;

        async function init() {
            try {
                const loader = new Loader({
                    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                    version: "weekly",
                    libraries: ["places"],
                });
                const { Map } = await loader.importLibrary("maps");
                await loader.importLibrary("places");

                // 定位：先用浏览器定位，不成功就用一个默认点（西雅图中心）
                const pos = await new Promise((resolve) => {
                    if (!navigator.geolocation) return resolve({ lat: 47.6097, lng: -122.3331 });
                    navigator.geolocation.getCurrentPosition(
                        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
                        () => resolve({ lat: 47.6097, lng: -122.3331 }),
                        { enableHighAccuracy: true, timeout: 5000 }
                    );
                });

                if (cancelled) return;

                map = new Map(ref.current, {
                    center: pos,
                    zoom: 14,
                    mapId: "eazy-order-map",
                });

                // 用户当前位置
                marker = new google.maps.Marker({
                    position: pos,
                    map,
                    title: "You are here",
                });

                // Nearby 搜索
                placesService = new google.maps.places.PlacesService(map);
                const request = {
                    location: pos,
                    radius: 1500,     // 米
                    type: "restaurant",
                };
                placesService.nearbySearch(request, (results, status) => {
                    if (cancelled) return;
                    if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
                        setErr("Nearby search failed.");
                        setLoading(false);
                        return;
                    }
                    // 拿到 place_id 列表给父组件
                    const ids = results.map(r => r.place_id).filter(Boolean);
                    onPlaceIds?.(ids);

                    // 可选：在地图上加 marker（未来再做美化）
                    results.forEach((r) => {
                        if (!r.geometry?.location) return;
                        new google.maps.Marker({
                            position: r.geometry.location,
                            map,
                            title: r.name,
                        });
                    });

                    setLoading(false);
                });
            } catch (e) {
                console.error(e);
                setErr("Map init failed.");
                setLoading(false);
            }
        }

        init();
        return () => { cancelled = true; };
    }, [onPlaceIds]);

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
