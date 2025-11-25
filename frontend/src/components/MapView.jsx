// src/components/MapView.jsx
import { useEffect, useRef, useState } from "react";

export default function MapView({ onPlaceIds, onMarkerClick, allowedPlaceIds = [] }) {
    const ref = useRef(null);
    const restMarkersRef = useRef([]);
    const youMarkerRef = useRef(null);
    const resultsRef = useRef([]);
    const cbRef = useRef(onMarkerClick);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);

    const idleTimerRef = useRef(null);
    const searchingRef = useRef(false);
    const lastKeyRef = useRef("");
    const mountedRef = useRef(false);

    useEffect(() => {
        cbRef.current = onMarkerClick;
    }, [onMarkerClick]);

    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                if (mountedRef.current) return;
                mountedRef.current = true;

                const { Map } = await google.maps.importLibrary("maps");
                const { AdvancedMarkerElement: Marker } = await google.maps.importLibrary("marker");

                // inti pos
                const pos = await new Promise((resolve) => {
                    if (!navigator.geolocation)
                        return resolve({ lat: 47.6097, lng: -122.3331 });
                    navigator.geolocation.getCurrentPosition(
                        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
                        () => resolve({ lat: 47.6097, lng: -122.3331 }),
                        { enableHighAccuracy: true, timeout: 3000 }
                    );
                });
                if (cancelled) return;

                const map = new Map(ref.current, {
                    center: pos,
                    zoom: 13,
                    mapId: "dfc9387e2257609b80304c82",
                    gestureHandling: "greedy",
                });
                mapRef.current = map;

                // You are here
                const userIcon = document.createElement("img");
                userIcon.src = "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png";
                userIcon.style.width = "30px";
                userIcon.style.height = "45px";

                const you = new Marker({
                    map,
                    position: pos,
                    title: "You are here",
                    content: userIcon,
                });
                youMarkerRef.current = you;

                map.addListener("idle", () => {
                    if (!youMarkerRef.current) return;
                    const center = map.getCenter();
                    youMarkerRef.current.position = center;

                    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
                    idleTimerRef.current = setTimeout(() => {
                        doNearbySearch();
                    }, 500);
                });

                setLoading(false);
            } catch (e) {
                console.error(e);
                setErr(`Map init failed: ${e?.message || e}`);
                setLoading(false);
            }
        }

        init();
        return () => {
            cancelled = true;
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            restMarkersRef.current.forEach(m => (m.map = null));
            restMarkersRef.current = [];
            if (youMarkerRef.current) youMarkerRef.current.map = null;
            youMarkerRef.current = null;
            mapRef.current = null;
            mountedRef.current = false;
        };
    }, [onPlaceIds]);

    // draw restaurant markers based on results & allowedPlaceIds
    useEffect(() => {
        const markerLib = google.maps.marker;
        const map = mapRef.current;
        if (!map || !markerLib) return;
        const { AdvancedMarkerElement: Marker } = markerLib;

        restMarkersRef.current.forEach(m => (m.map = null));
        restMarkersRef.current = [];

        if (!allowedPlaceIds || allowedPlaceIds.length === 0) return;
        const allowed = new Set(allowedPlaceIds);

        resultsRef.current.forEach((p) => {
            if (!p.location || !allowed.has(p.id)) return;
            const icon = document.createElement("img");
            icon.src = "https://maps.gstatic.com/mapfiles/ms2/micons/orange-dot.png";
            icon.style.width = "20px";
            icon.style.height = "20px";

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

    function estimateRadiusMeters(map) {
        const zoom = map.getZoom();
        const c = map.getCenter();
        const metersPerPixel =
            156543.03392 * Math.cos((c.lat() * Math.PI) / 180) / Math.pow(2, zoom);
        const { width, height } = map.getDiv().getBoundingClientRect();
        return Math.max(500, Math.min(8000, metersPerPixel * Math.min(width, height) / 2 * 0.9));
    }

    // 为当前视野生成唯一 key
    function makeSearchKey(map) {
        const c = map.getCenter();
        const r = Math.round(estimateRadiusMeters(map) / 50);
        return `${c.lat().toFixed(5)}|${c.lng().toFixed(5)}|${r}`;
    }

    // 执行附近餐厅搜索
    async function doNearbySearch() {
        const map = mapRef.current;
        if (!map) return;

        const key = makeSearchKey(map);
        if (key === lastKeyRef.current || searchingRef.current) return;

        searchingRef.current = true;
        try {
            const { Place } = await google.maps.importLibrary("places");
            const c = map.getCenter();
            const req = {
                fields: ["id", "displayName", "location"],
                locationRestriction: { center: { lat: c.lat(), lng: c.lng() }, radius: Math.round(estimateRadiusMeters(map)) },
                includedPrimaryTypes: ["restaurant"],
            };

            const resp = await Place.searchNearby(req);
            const results = resp?.places || [];
            resultsRef.current = results;
            lastKeyRef.current = key;

            const ids = results.map(p => p.id).filter(Boolean);
            onPlaceIds?.(ids);
        } catch (e) {
            console.error(e);
            setErr(`Nearby Search failed: ${e?.message || e}`);
        } finally {
            searchingRef.current = false;
        }
    }

    function jumpToSeattle() {
        const map = mapRef.current;
        if (!map) return;

        const seattle = { lat: 47.6062, lng: -122.3321 };
        map.setCenter(seattle);
        map.setZoom(15);

    }

    return (
        <div className="relative w-full h-full">
            <div ref={ref} className="w-full h-full rounded-xl" />

            {/* jump to seattle */}
            <button
                type="button"
                onClick={jumpToSeattle}
                className="absolute right-16 top-2 z-10 rounded-lg bg-[#FF6A1A] text-xs text-white shadow-2xl"
            >
                Live Demo Area: Seattle
            </button>

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
