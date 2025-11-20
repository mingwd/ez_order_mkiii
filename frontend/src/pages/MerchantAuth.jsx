// src/pages/MerchantAuth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiMe, apiRegisterMerchant } from "../api/client";

export default function MerchantAuth() {
    const nav = useNavigate();
    const [mode, setMode] = useState("login"); // login | signup
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!username || !password) {
            setError("Username / password 不能为空");
            return;
        }
        try {
            setError("");
            setLoading(true);

            if (mode === "signup") {
                await apiRegisterMerchant(username, password);
            }

            await apiLogin(username, password);
            const me = await apiMe();

            if (me.user_type !== "owner") {
                // 防止用 customer 账号误登录
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                setError("This account is not a merchant (owner).");
                return;
            }
            // 登录成功，跳转商家 dashboard
            nav("/merchant/dashboard");
        } catch (err) {
            console.error(err);
            setError("Auth failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border">
                <h1 className="text-xl font-semibold text-gray-800 mb-2">
                    {mode === "login" ? "Merchant Login" : "Merchant Sign up"}
                </h1>
                <p className="text-xs text-gray-500 mb-4">
                    这是商家入口（owner），普通用户请走 /auth。
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            Username
                        </label>
                        <input
                            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && <div className="text-xs text-red-600">{error}</div>}

                    <button
                        type="submit"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading
                            ? "Working..."
                            : mode === "login"
                                ? "Login as merchant"
                                : "Sign up as merchant"}
                    </button>
                </form>

                <div className="mt-4 text-xs text-gray-500 flex justify-between">
                    <button
                        type="button"
                        className="underline"
                        onClick={() =>
                            setMode((m) => (m === "login" ? "signup" : "login"))
                        }
                        disabled={loading}
                    >
                        {mode === "login"
                            ? "No merchant account? Sign up"
                            : "Already have account? Login"}
                    </button>

                    <button
                        type="button"
                        className="underline"
                        onClick={() => nav("/")}
                    >
                        Back to customer site
                    </button>
                </div>
            </div>
        </div>
    );
}