// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { apiMe } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const nav = useNavigate();
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiMe();
                setMe(data);
            } catch {
                nav("/auth");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function handleLogout() {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        nav("/");      // 直接回主页
    }

    if (loading)
        return (
            <div className="w-screen h-screen flex items-center justify-center">
                Loading…
            </div>
        );

    if (!me)
        return (
            <div className="w-screen h-screen flex items-center justify-center">
                Redirecting…
            </div>
        );

    return (
        <div className="w-screen min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            {/* 顶部信息卡片 */}
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-md p-6 mb-6 border">
                <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Customer information & preferences
                </p>

                <div className="mt-4 space-y-2 text-sm">
                    <div>
                        <strong className="text-gray-700">Username:</strong>{" "}
                        {me.username}
                    </div>
                    <div>
                        <strong className="text-gray-700">User Type:</strong>{" "}
                        {me.user_type || "customer"}
                    </div>
                </div>
            </div>

            {/* 以下三个区域未来会填满：tags / memo / health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                {/* 偏好标签 */}
                <div className="bg-white rounded-xl shadow-md p-6 border">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Preferences (Tags)
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">
                        Coming soon – personalized ordering
                    </p>
                    <div className="text-sm text-gray-500 italic">
                        No tags yet.
                    </div>
                </div>

                {/* Memo */}
                <div className="bg-white rounded-xl shadow-md p-6 border">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Memo
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">
                        A personal note or dietary info
                    </p>
                    <div className="text-sm text-gray-500 italic">
                        No memo yet.
                    </div>
                </div>

                {/* 健康配置（BMR / height / weight / activity） */}
                <div className="bg-white rounded-xl shadow-md p-6 border md:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Health Profile
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">
                        (height, weight, activity, BMR) — coming soon
                    </p>
                    <div className="text-sm text-gray-500 italic">
                        Not set.
                    </div>
                </div>
            </div>

            {/* 底部按钮：返回主页 + 登出 */}
            <div className="mt-8 flex items-center gap-3">
                <button
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
                    onClick={() => nav("/")}
                >
                    Back to home
                </button>

                <button
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}