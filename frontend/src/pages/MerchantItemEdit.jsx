// src/pages/MerchantItemEdit.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiItems } from "../api/client";

export default function MerchantItemEdit() {
    const nav = useNavigate();
    const { itemId } = useParams();
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [item, setItem] = useState(null);

    const isNew = itemId === "new"; // 我们其实用的是 /restaurants/:id/items/new，下面用 restId 区分

    // 如果你想复用这个组件处理两种路由，可以再扩展一下，这里先简单做「编辑已有 item」的占位。
    useEffect(() => {
        (async () => {
            if (!itemId) return;
            // 先留白：未来可以搞一个 apiGetItem(itemId)
            // 现在先不查，直接显示 itemId
            setLoading(false);
        })();
    }, [itemId]);

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-lg bg-white border rounded-2xl shadow-lg p-6">
                <h1 className="text-xl font-semibold text-gray-800 mb-2">
                    Edit Item (TODO)
                </h1>
                <p className="text-xs text-gray-500 mb-4">
                    这里是单品编辑页面占位。itemId: {itemId}
                </p>

                <p className="text-sm text-gray-700 mb-6">
                    下一步我们在这里加上 form，可以编辑 name / description / price / is_active
                    以及 tag。
                </p>

                <button
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm"
                    onClick={() => nav(-1)}
                >
                    Back
                </button>
            </div>
        </div>
    );
}