// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Profile from "./pages/Profile.jsx";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="w-screen h-screen flex flex-col items-center justify-center text-gray-700">
              <h1 className="text-2xl font-semibold mb-2">404 Not Found</h1>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
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