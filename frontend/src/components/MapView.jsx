import { useEffect, useRef, useState } from "react";

export default function MapView({ onPlaceIds, onMarkerClick }) {
    const ref = useRef(null);
    const markersRef = useRef([]);
    const cbRef = useRef(onMarkerClick);           // ← 持有最新回调
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);


    // 更新回调引用，但不触发重建
    useEffect(() => {
        cbRef.current = onMarkerClick;
    }, [onMarkerClick]);

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

                // 用户定位 marker
                const userIcon = document.createElement("img");
                userIcon.src = "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png";
                userIcon.style.width = "20px";
                userIcon.style.height = "20px";
                const you = new Marker({ map, position: pos, title: "You are here", content: userIcon });
                markersRef.current.push(you);

                // Nearby
                const req = {
                    fields: ["id", "displayName", "location"],
                    locationRestriction: { center: pos, radius: 2000 },
                    includedPrimaryTypes: ["restaurant"],
                };
                const resp = await Place.searchNearby(req);
                const results = resp?.places || [];
                if (cancelled) return;

                const ids = results.map((p) => p.id).filter(Boolean);
                onPlaceIds?.(ids);

                // 餐厅 markers
                results.forEach((p) => {
                    if (!p.location) return;
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
                    m.addListener("gmp-click", () => cbRef.current?.(p.id)); // ← 使用 ref 中的回调
                    markersRef.current.push(m);
                });

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
            markersRef.current.forEach((m) => (m.map = null));
            markersRef.current = [];
        };
    }, [onPlaceIds]); // ⚠️ 只依赖 onPlaceIds，去掉 onMarkerClick

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
