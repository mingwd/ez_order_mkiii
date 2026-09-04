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
            setErr("Username / password can not be empty");
            return;
        }

        try {
            setErr("");
            setLoading(true);

            if (mode === "signup") {
                // create account
                await apiRegisterMerchant(username, password);
            }

            // login
            await apiLogin(username, password);
            const me = await apiMe();

            if (me.user_type !== "owner") {
                // customer account, logout immediately
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                setErr("This account is not a merchant.");
                return;
            }

            // login redirect dashboard
            nav("/merchant/dashboard");
        } catch (e) {
            console.error(e);
            setErr("Auth failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md ez-card rounded-3xl p-8 relative">
                <button
                    className="btn-link absolute right-6 top-6 text-xs"
                    onClick={() => nav("/")}
                >
                    ← Back to Customer
                </button>

                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] mb-2">
                    Merchant
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ez-ink)] mb-6">
                    {mode === "login" ? "Welcome back" : "Create account"}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label>Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {err && <div className="text-xs text-red-600">{err}</div>}

                    <button
                        type="submit"
                        className="w-full mt-1"
                        disabled={loading}
                    >
                        {loading ? "Working..." : mode === "login" ? "Login" : "Sign up"}
                    </button>
                </form>

                <div className="mt-5 text-sm text-[var(--ez-muted)] text-center">
                    {mode === "login" ? (
                        <>
                            No merchant account?{" "}
                            <button
                                type="button"
                                className="btn-link"
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
                                className="btn-link"
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