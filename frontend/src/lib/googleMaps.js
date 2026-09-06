const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let loadPromise;

function installImportLibraryBootstrap() {
    const g = { key: API_KEY, v: "weekly" };
    const c = "google";
    const l = "importLibrary";
    const q = "__ib__";
    const b = window;
    b[c] = b[c] || {};
    const d = b[c].maps || (b[c].maps = {});
    const r = new Set();
    const e = new URLSearchParams();
    let h;
    let a;

    const u = () =>
        h ||
        (h = new Promise((f, n) => {
            a = document.createElement("script");
            e.set("libraries", [...r].join(","));
            for (const k in g) {
                e.set(k.replace(/[A-Z]/g, (t) => `_${t[0].toLowerCase()}`), g[k]);
            }
            e.set("callback", `${c}.maps.${q}`);
            a.src = `https://maps.googleapis.com/maps/api/js?${e}`;
            d[q] = f;
            a.onerror = () => n(new Error("The Google Maps JavaScript API could not load."));
            a.async = true;
            a.defer = true;
            document.head.appendChild(a);
        }));

    if (!d[l]) {
        d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
    }
}

export function loadGoogleMaps() {
    if (loadPromise) return loadPromise;

    if (!API_KEY) {
        loadPromise = Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
        return loadPromise;
    }

    installImportLibraryBootstrap();

    loadPromise = window.google.maps
        .importLibrary("maps")
        .then(() => window.google.maps);

    return loadPromise;
}

export function isGoogleMapsReady() {
    return Boolean(window.google?.maps?.importLibrary && window.google?.maps?.Map);
}
