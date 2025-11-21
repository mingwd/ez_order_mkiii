// src/pages/MerchantAuth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiRegisterMerchant, apiMe } from "../api/client";

export default function MerchantAuth() {
    const nav = useNavigate();
    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!username || !password) {
            setErr("Username / password 不能为空");
            return;
        }

        try {
            setErr("");
            setLoading(true);

            if (mode === "signup") {
                // 创建 merchant 账号
                await apiRegisterMerchant(username, password);
            }

            // 登录（无论是刚注册还是已有账号）
            await apiLogin(username, password);
            const me = await apiMe();

            if (me.user_type !== "owner") {
                // 防止拿 customer 账号来登录商家后台
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                setErr("This account is not a merchant.");
                return;
            }

            // 登录成功 → dashboard
            nav("/merchant/dashboard");
        } catch (e) {
            console.error(e);
            setErr("Auth failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-screen h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border p-6 relative">
                <button
                    className="absolute right-4 top-4 text-xs text-gray-400 hover:text-gray-700"
                    onClick={() => nav("/")}
                >
                    ← Back
                </button>

                <h1 className="text-xl font-semibold text-gray-800 mb-2">
                    Merchant {mode === "login" ? "Login" : "Sign up"}
                </h1>
                <p className="text-xs text-gray-500 mb-4">
                    这是商家后台入口，注册账号会自动标记为 <span className="font-mono">merchant</span>。
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Username</label>
                        <input
                            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {err && <div className="text-xs text-red-600">{err}</div>}

                    <button
                        type="submit"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 text-sm font-medium text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? "Working..." : mode === "login" ? "Login" : "Sign up"}
                    </button>
                </form>

                <div className="mt-4 text-xs text-gray-500 text-center">
                    {mode === "login" ? (
                        <>
                            No merchant account?{" "}
                            <button
                                type="button"
                                className="underline"
                                disabled={loading}
                                onClick={() => {
                                    setMode("signup");
                                    setErr("");
                                }}
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button
                                type="button"
                                className="underline"
                                disabled={loading}
                                onClick={() => {
                                    setMode("login");
                                    setErr("");
                                }}
                            >
                                Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}