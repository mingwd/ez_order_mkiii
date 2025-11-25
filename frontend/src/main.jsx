// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Profile from "./pages/Profile.jsx";
import MerchantAuth from "./pages/MerchantAuth.jsx";
import MerchantDashboard from "./pages/MerchantDashboard.jsx";
import MerchantMenu from "./pages/MerchantMenu.jsx";
import MerchantItemEdit from "./pages/MerchantItemEdit.jsx";

if (!window.googleMapsScriptLoaded) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
  script.async = true;

  document.head.appendChild(script);
  window.googleMapsScriptLoaded = true;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />

        {/* merchant */}
        <Route path="/merchant/auth" element={<MerchantAuth />} />
        <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
        <Route path="/merchant/restaurants/:restId/menu" element={<MerchantMenu />} />
        <Route
          path="/merchant/items/:itemId/edit"
          element={<MerchantItemEdit mode="edit" />}
        />
        <Route
          path="/merchant/restaurants/:restId/items/new"
          element={<MerchantItemEdit mode="create" />}
        />


        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="w-screen h-screen flex flex-col items-center justify-center text-gray-700">
              <h1 className="text-2xl font-semibold mb-2">404 Not Found</h1>
              <button
                onClick={() => (window.location.href = "/")}
              >
                Back to home
              </button>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);