import React, { useEffect, useState } from "react";
import { apiUrl } from "../../utils/apiBase";
import { adminFetch } from "../../utils/adminAuth";

export default function AdminStats({ open, onClose }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, sold: 0, hidden: 0, requests: 0, requestsNew: 0 });
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                // همه خودروها
                const carsRes = await adminFetch(apiUrl("cars/admin/all"));
                const carsData = await carsRes.json().catch(() => ({}));
                if (!carsRes.ok) throw new Error(carsData?.error || "خطا در آمار خودرو");

                // درخواست‌ها
                const reqRes = await adminFetch(apiUrl("visit-requests?limit=1"));
                const reqData = await reqRes.json().catch(() => ({}));
                if (!reqRes.ok) throw new Error(reqData?.error || "خطا در آمار درخواست");

                if (!mounted) return;
                const carStats = carsData?.stats || { total: 0, active: 0, sold: 0, hidden: 0 };
                const totalRequests = reqData?.total ?? (Array.isArray(reqData?.requests) ? reqData.requests.length : 0);
                const newRequests = Array.isArray(reqData?.stats) ? (reqData.stats.find(s => s.status === "جدید")?.count || 0) : 0;

                setStats({
                    total: carStats.total || 0,
                    active: carStats.active || 0,
                    sold: carStats.sold || 0,
                    hidden: carStats.hidden || 0,
                    requests: totalRequests,
                    requestsNew: newRequests,
                });
            } catch (e) {
                if (mounted) setError(e?.message || "خطا");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [open]);

    if (!open) return null;

    const maxVal = Math.max(stats.total, stats.active, stats.sold, stats.hidden, stats.requests, 1);
    const bars = [
        { label: "ثبت شده", value: stats.total, color: "#111", bg: "#111", light: "#e0e0e0", icon: "🚗" },
        { label: "فعال", value: stats.active, color: "#2e7d32", bg: "#2e7d32", light: "#c8e6c9", icon: "✅" },
        { label: "فروخته شده", value: stats.sold, color: "#c62828", bg: "#c62828", light: "#ffcdd2", icon: "🏁" },
        { label: "مخفی", value: stats.hidden, color: "#6d4c41", bg: "#6d4c41", light: "#d7ccc8", icon: "👁️‍🗨️" },
        { label: "درخواست بازدید", value: stats.requests, color: "#0d47a1", bg: "#0d47a1", light: "#bbdefb", icon: "📋" },
        { label: "جدید", value: stats.requestsNew, color: "#f57f17", bg: "#f57f17", light: "#ffecb3", icon: "🆕" },
    ];

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "16px", fontFamily: "Tahoma, Arial, sans-serif", direction: "rtl" }}>
            <div style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "760px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
                {/* Header */}
                <div style={{ padding: "22px 24px", background: "linear-gradient(135deg, #111 0%, #222 100%)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#d4af37", fontWeight: 900, marginBottom: "6px" }}>PROFESSIONAL ANALYTICS</div>
                        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>آمار حرفه‌ای فروشگاه</h2>
                        <div style={{ color: "#aaa", fontSize: "11px", marginTop: "6px" }}>نمای کلی خودروها و درخواست‌های بازدید</div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 14px", borderRadius: "10px", cursor: "pointer", fontWeight: 800 }}>✕ بستن</button>
                </div>

                <div style={{ overflowY: "auto", padding: "22px", flex: 1 }}>
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>در حال بارگذاری آمار...</div>
                    ) : error ? (
                        <div style={{ padding: "20px", background: "#ffebee", color: "#c62828", borderRadius: "12px", textAlign: "center" }}>{error}</div>
                    ) : (
                        <>
                            {/* Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "22px" }}>
                                {bars.slice(0, 3).map((b) => (
                                    <div key={b.label} style={{ background: `linear-gradient(135deg, ${b.light} 0%, #fff 100%)`, border: `1px solid ${b.bg}22`, borderRadius: "14px", padding: "16px", position: "relative", overflow: "hidden" }}>
                                        <div style={{ position: "absolute", top: "-10px", left: "-10px", fontSize: "42px", opacity: 0.08 }}>{b.icon}</div>
                                        <div style={{ color: b.bg, fontSize: "11px", fontWeight: 900, letterSpacing: "1px", marginBottom: "8px" }}>{b.label}</div>
                                        <div style={{ fontSize: "28px", fontWeight: 900, color: "#111", lineHeight: 1 }}>{b.value}</div>
                                        <div style={{ marginTop: "8px", height: "4px", background: "#eee", borderRadius: "999px", overflow: "hidden" }}>
                                            <div style={{ width: `${Math.max(8, (b.value / maxVal) * 100)}%`, height: "100%", background: b.bg, borderRadius: "999px" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "26px" }}>
                                {bars.slice(3).map((b) => (
                                    <div key={b.label} style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: "14px", padding: "16px" }}>
                                        <div style={{ color: "#777", fontSize: "11px", fontWeight: 800, marginBottom: "6px" }}>{b.icon} {b.label}</div>
                                        <div style={{ fontSize: "22px", fontWeight: 900 }}>{b.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Column Chart Professional */}
                            <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "16px", padding: "18px", boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                    <strong style={{ fontSize: "13px" }}>نمودار ستونی حرفه‌ای</strong>
                                    <span style={{ fontSize: "10px", color: "#888", background: "#f5f5f5", padding: "4px 10px", borderRadius: "999px" }}>مقایسه‌ای</span>
                                </div>

                                {/* Chart */}
                                <div style={{ display: "flex", alignItems: "end", gap: "10px", height: "200px", padding: "0 8px 8px", borderBottom: "1px solid #eee", borderLeft: "1px solid #f0f0f0" }}>
                                    {bars.map((b) => {
                                        const h = Math.max(12, (b.value / maxVal) * 160);
                                        return (
                                            <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                                <div style={{ background: b.bg, color: "#fff", fontSize: "11px", fontWeight: 900, padding: "3px 8px", borderRadius: "999px", minWidth: "22px", textAlign: "center", boxShadow: `0 4px 12px ${b.bg}55` }}>{b.value}</div>
                                                <div style={{ width: "100%", maxWidth: "64px", height: `${h}px`, background: `linear-gradient(180deg, ${b.bg} 0%, ${b.bg}cc 100%)`, borderRadius: "10px 10px 4px 4px", position: "relative", boxShadow: `0 8px 18px ${b.bg}33`, transition: "height 0.6s cubic-bezier(.22,1,.36,1)" }}>
                                                    <div style={{ position: "absolute", top: "6px", left: "6px", right: "6px", height: "14px", background: "rgba(255,255,255,0.22)", borderRadius: "6px" }} />
                                                </div>
                                                <div style={{ fontSize: "10px", fontWeight: 800, color: "#555", textAlign: "center", lineHeight: 1.3, minHeight: "28px" }}>{b.icon}<br />{b.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ display: "flex", gap: "12px", marginTop: "14px", flexWrap: "wrap", justifyContent: "center" }}>
                                    {bars.map((b) => (
                                        <div key={b.label + "-legend"} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#666" }}>
                                            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: b.bg, display: "inline-block" }} />
                                            {b.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div style={{ marginTop: "18px", background: "linear-gradient(135deg, #111 0%, #1e1e1e 100%)", color: "#fff", borderRadius: "14px", padding: "16px 18px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                                <div style={{ fontSize: "12px" }}>
                                    <span style={{ color: "#d4af37", fontWeight: 900 }}>نرخ فروش:</span> {stats.total ? Math.round((stats.sold / stats.total) * 100) : 0}% از کل
                                </div>
                                <div style={{ fontSize: "12px" }}>
                                    <span style={{ color: "#d4af37", fontWeight: 900 }}>فعال:</span> {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% از کل
                                </div>
                                <div style={{ fontSize: "12px", color: "#aaa" }}>
                                    مجموع درخواست‌ها: {stats.requests} · جدید: {stats.requestsNew}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
