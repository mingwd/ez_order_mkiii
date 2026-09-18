export default function MerchantBar({ showLogout = true }) {
    function handleLogout() {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/merchant/auth";
    }

    return (
        <header className="ez-header w-full sticky top-0 z-30">
            <div className="h-14 px-5 md:px-8 flex items-center justify-between gap-3">
                <a
                    href="https://eazy-order.com"
                    className="text-sm font-semibold text-[var(--ez-primary)] hover:underline"
                >
                    ← eazy-order.com
                </a>
                {showLogout ? (
                    <button type="button" className="btn-ghost" onClick={handleLogout}>
                        Logout
                    </button>
                ) : (
                    <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ez-muted)]">
                        Merchant
                    </span>
                )}
            </div>
        </header>
    );
}
