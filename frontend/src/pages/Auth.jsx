// src/pages/Auth.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiRegisterCustomer, apiMe } from "../api/client";

export default function Auth() {
    const navigate = useNavigate();

    // ---- 表单状态 ----
    const [mode, setMode] = useState("login"); // login | signup
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 如果用户已登录，访问 /auth 就自动跳回主页
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem("access");
                if (!token) return;
                await apiMe();
                navigate("/");
            } catch {
                /* ignore */
            }
        })();
    }, []);

    // ---- 提交 ----
    async function handleSubmit(e) {
        e.preventDefault();
        if (!username || !password) {
            setError("Username / password cannot be empty");
            return;
        }

        try {
            setError("");
            setLoading(true);

            if (mode === "signup") {
                await apiRegisterCustomer(username, password);
            }

            // 登录
            await apiLogin(username, password);

            // 拉取用户资料
            await apiMe();

            // 跳主页
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Authentication failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">

                {/* 标题 */}
                <h1 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                    {mode === "login" ? "Login" : "Sign up"}
                </h1>

                <p className="text-xs text-gray-500 mb-5 text-center">
                    All accounts created here are customer accounts.
                </p>

                {/* 表单 */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-700">Username</label>
                        <input
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700">Password</label>
                        <input
                            type="password"
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 outline-none focus:ring-1 focus:ring-orange-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="text-xs text-red-600">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 mt-2 rounded-lg bg-orange-300 hover:bg-orange-400 transition font-medium text-gray-800 disabled:opacity-50"
                    >
                        {loading
                            ? "Working…"
                            : mode === "login"
                                ? "Login"
                                : "Sign up"}
                    </button>
                </form>

                {/* 切换登录/注册 */}
                <div className="mt-4 text-xs text-gray-600 text-center">
                    {mode === "login" ? (
                        <>
                            No account?{" "}
                            <button
                                onClick={() => {
                                    setMode("signup");
                                    setError("");
                                }}
                                disabled={loading}
                                className="underline"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button
                                onClick={() => {
                                    setMode("login");
                                    setError("");
                                }}
                                disabled={loading}
                                className="underline"
                            >
                                Login
                            </button>
                        </>
                    )}
                </div>

                {/* 返回主页 */}
                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate("/")}
                        className="text-xs text-gray-500 underline"
                    >
                        Back to home
                    </button>
                </div>
            </div>
        </div>
    );
}