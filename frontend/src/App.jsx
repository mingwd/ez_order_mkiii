import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("loading...");
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
    fetch(`${base}/healthz`)
      .then(r => r.json())
      .then(d => setStatus(d.status))
      .catch(() => setStatus("error"));
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 rounded-2xl shadow bg-white">
        <h1 className="text-2xl font-bold mb-2">ez_order_mkiii</h1>
        <p>Backend health: <span className="font-mono">{status}</span></p>
      </div>
    </div>
  );
}

export default App;
