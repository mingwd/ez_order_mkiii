// src/pages/Auth.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiRegisterCustomer, apiMe } from "../api/client";

export default function Auth() {
    const navigate = useNavigate();

    // ---- status ----
    const [mode, setMode] = useState("login"); // login | signup
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // redirect to home if already logged in
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

    // ---- post ----
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

            await apiLogin(username, password);

            // user data
            await apiMe();

            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Authentication failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md ez-card rounded-3xl p-8">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-primary)] text-center mb-2">
                    Customer
                </p>
                <h1 className="text-4xl font-extrabold text-[var(--ez-ink)] mb-2 text-center tracking-tight">
                    {mode === "login" ? "Welcome back" : "Create account"}
                </h1>

                <p className="text-sm text-[var(--ez-muted)] mb-6 text-center">
                    All accounts created here are customer accounts.
                </p>

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

                    {error && (
                        <div className="text-xs text-red-600">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2"
                    >
                        {loading
                            ? "Working…"
                            : mode === "login"
                                ? "Login"
                                : "Sign up"}
                    </button>
                </form>

                <div className="mt-5 text-sm text-[var(--ez-muted)] text-center">
                    {mode === "login" ? (
                        <>
                            No account?{" "}
                            <button
                                className="btn-link"
                                onClick={() => {
                                    setMode("signup");
                                    setError("");
                                }}
                                disabled={loading}
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button
                                className="btn-link"
                                onClick={() => {
                                    setMode("login");
                                    setError("");
                                }}
                                disabled={loading}
                            >
                                Login
                            </button>
                        </>
                    )}
                </div>

                <div className="mt-5 text-center">
                    <button
                        className="btn-ghost"
                        onClick={() => navigate("/")}
                    >
                        Back to home
                    </button>
                </div>
            </div>
        </div>
    );
}