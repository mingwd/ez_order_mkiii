// src/components/MapView.jsx
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../lib/googleMaps";

function createPinElement(name) {
    const root = document.createElement("div");
    root.className = "ez-map-pin";

    const label = document.createElement("div");
    label.className = "ez-map-pin-label";
    label.textContent = name || "Restaurant";

    const mark = document.createElement("div");
    mark.className = "ez-map-pin-mark";

    const head = document.createElement("span");
    head.className = "ez-map-pin-head";

    const point = document.createElement("span");
    point.className = "ez-map-pin-point";

    mark.append(head, point);
    root.append(label, mark);
    return root;
}

export default function MapView({
    onPlaceIds,
    onMarkerClick,
    onMarkerHover,
    hoveredPlaceId = null,
    placeNames = {},
    allowedPlaceIds = [],
}) {
    const ref = useRef(null);
    const restMarkersRef = useRef([]);
    const youMarkerRef = useRef(null);
    const resultsRef = useRef([]);
    const cbRef = useRef(onMarkerClick);
    const hoverCbRef = useRef(onMarkerHover);
    const onPlaceIdsRef = useRef(onPlaceIds);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef(null);

    const idleTimerRef = useRef(null);
    const searchingRef = useRef(false);
    const lastKeyRef = useRef("");

    useEffect(() => {
        cbRef.current = onMarkerClick;
    }, [onMarkerClick]);

    useEffect(() => {
        hoverCbRef.current = onMarkerHover;
    }, [onMarkerHover]);

    useEffect(() => {
        onPlaceIdsRef.current = onPlaceIds;
    }, [onPlaceIds]);

    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                await loadGoogleMaps();
                if (cancelled || !ref.current) return;

                const { Map } = await google.maps.importLibrary("maps");
                const { AdvancedMarkerElement: Marker } = await google.maps.importLibrary("marker");
                if (cancelled || !ref.current) return;

                const pos = await new Promise((resolve) => {
                    if (!navigator.geolocation)
                        return resolve({ lat: 47.6097, lng: -122.3331 });
                    navigator.geolocation.getCurrentPosition(
                        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
                        () => resolve({ lat: 47.6097, lng: -122.3331 }),
                        { enableHighAccuracy: true, timeout: 3000 }
                    );
                });
                if (cancelled || !ref.current) return;

                const map = new Map(ref.current, {
                    center: pos,
                    zoom: 13,
                    mapId: "dfc9387e2257609b80304c82",
                    gestureHandling: "greedy",
                });
                mapRef.current = map;

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

                setMapReady(true);
                setLoading(false);
            } catch (e) {
                if (cancelled) return;
                console.error(e);
                setErr(`Map init failed: ${e?.message || e}`);
                setLoading(false);
            }
        }

        init();
        return () => {
            cancelled = true;
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            restMarkersRef.current.forEach(({ marker }) => (marker.map = null));
            restMarkersRef.current = [];
            if (youMarkerRef.current) youMarkerRef.current.map = null;
            youMarkerRef.current = null;
            mapRef.current = null;
        };
    }, []);

    // draw restaurant markers based on results & allowedPlaceIds
    useEffect(() => {
        const map = mapRef.current;
        const markerLib = window.google?.maps?.marker;
        if (!mapReady || !map || !markerLib) return;
        const { AdvancedMarkerElement: Marker } = markerLib;

        restMarkersRef.current.forEach(({ marker }) => (marker.map = null));
        restMarkersRef.current = [];

        if (!allowedPlaceIds || allowedPlaceIds.length === 0) return;
        const allowed = new Set(allowedPlaceIds);

        resultsRef.current.forEach((p) => {
            if (!p.location || !allowed.has(p.id)) return;
            const name = placeNames[p.id] || p.displayName?.text || "Restaurant";
            const pin = createPinElement(name);

            const m = new Marker({
                map,
                position: p.location,
                content: pin,
                gmpClickable: true,
                zIndex: 1,
            });
            m.addListener("gmp-click", () => cbRef.current?.(p.id));
            pin.addEventListener("pointerenter", () => {
                pin.classList.add("is-active");
                m.zIndex = 20;
                hoverCbRef.current?.(p.id);
            });
            pin.addEventListener("pointerleave", () => {
                pin.classList.remove("is-active");
                m.zIndex = 1;
                hoverCbRef.current?.(null);
            });
            restMarkersRef.current.push({ marker: m, el: pin, placeId: p.id });
        });
    }, [allowedPlaceIds, placeNames, mapReady]);

    useEffect(() => {
        restMarkersRef.current.forEach(({ marker, el, placeId }) => {
            const on = Boolean(hoveredPlaceId && placeId === hoveredPlaceId);
            el.classList.toggle("is-active", on);
            marker.zIndex = on ? 20 : 1;
        });
    }, [hoveredPlaceId]);

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
            onPlaceIdsRef.current?.(ids);
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
                className="absolute left-3 bottom-3 z-10 rounded-xl text-xs shadow-lg"
            >
                Live Demo Area: Seattle
            </button>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--ez-muted)] bg-white/90">
                    Loading map…
                </div>
            )}
            {err && (
                <div className="absolute left-3 top-3 text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl">
                    {err}
                </div>
            )}
        </div>
    );
}
