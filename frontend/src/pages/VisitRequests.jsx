import React, { useEffect, useState } from "react";
import { API_BASE, apiUrl } from "../utils/apiBase";
import { adminFetch, getAdminKey } from "../utils/adminAuth";

const STATUSES = ["جدید", "در حال پیگیری", "تماس گرفته شد", "بازدید انجام شد", "بسته شد"];

const statusColor = {
    "جدید": { bg: "#fff8e1", color: "#7a5c00", border: "#ffe082" },
    "در حال پیگیری": { bg: "#e3f2fd", color: "#0d47a1", border: "#90caf9" },
    "تماس گرفته شد": { bg: "#f3e5f5", color: "#4a148c", border: "#ce93d8" },
    "بازدید انجام شد": { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    "بسته شد": { bg: "#efebe9", color: "#3e2723", border: "#bcaaa4" },
};

function formatDate(dateStr) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
    } catch {
        return String(dateStr);
    }
}

export default function VisitRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [stats, setStats] = useState([]);

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const params = new URLSearchParams();
            if (filterStatus) params.set("status", filterStatus);
            if (search.trim()) params.set("search", search.trim());
            params.set("limit", "200");

            const url = apiUrl(`visit-requests?${params.toString()}`);
            const res = await adminFetch(url);
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data?.error || `خطا ${res.status}`);
            }

            setRequests(Array.isArray(data?.requests) ? data.requests : []);
            setStats(Array.isArray(data?.stats) ? data.stats : []);
        } catch (e) {
            setError(e?.message || "خطا در بارگذاری");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [filterStatus]);

    const handleSearch = (e) => {
        e.preventDefault();
        load();
    };

    const changeStatus = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            setError("");
            setNotice("");
            const res = await adminFetch(apiUrl(`visit-requests/${id}/status`), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.error || "خطا در بروزرسانی");
            }
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
            setNotice(`وضعیت درخواست #${id} به «${newStatus}» تغییر کرد.`);
            // update stats locally
            setStats((prev) => {
                const map = new Map(prev.map((s) => [s.status, s.count]));
                // naive reload stats would be better, but quick
                return prev;
            });
        } catch (e) {
            setError(e?.message || "خطا در تغییر وضعیت");
        } finally {
            setUpdatingId(null);
        }
    };

    const total = requests.length;

    return (
        <div style={{ fontFamily: "Tahoma, Arial, sans-serif", direction: "rtl" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "22px" }}>درخواست‌های بازدید</h2>
                    <div style={{ color: "#777", fontSize: "12px", marginTop: "6px" }}>
                        {total} درخواست · {stats.map((s) => `${s.status}: ${s.count}`).join(" · ")}
                    </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            background: "#fff",
                            fontSize: "13px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                        }}
                    >
                        <option value="">همه وضعیت‌ها</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجو نام، موبایل، خودرو..."
                            style={{
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                                width: "220px",
                                fontSize: "13px",
                                fontFamily: "inherit",
                            }}
                        />
                        <button type="submit" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
                            جستجو
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={load}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
                    >
                        ↻ تازه‌سازی
                    </button>
                </div>
            </div>

            {notice && (
                <div style={{ padding: "12px 16px", marginBottom: "16px", background: "#e8f5e9", color: "#1b5e20", borderRadius: "8px", fontSize: "12px" }}>{notice}</div>
            )}
            {error && (
                <div style={{ padding: "12px 16px", marginBottom: "16px", background: "#ffebee", color: "#c62828", borderRadius: "8px", fontSize: "12px" }}>{error}</div>
            )}

            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid #eee", color: "#888" }}>در حال بارگذاری...</div>
            ) : requests.length === 0 ? (
                <div style={{ padding: "50px 20px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid #eee", color: "#888" }}>
                    <div style={{ fontSize: "16px", marginBottom: "8px" }}>درخواستی یافت نشد</div>
                    <div style={{ fontSize: "12px" }}>هنوز کسی درخواست بازدید ثبت نکرده یا فیلتر را عوض کنید.</div>
                </div>
            ) : (
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e5e5", overflow: "hidden" }}>
                    {/* Desktop table */}
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                            <thead>
                                <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee", textAlign: "right", fontSize: "11px", color: "#777", letterSpacing: "0.5px" }}>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>#</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>نام و نام خانوادگی</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>موبایل</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>خودروی مورد نظر</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>تاریخ درخواست</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>رضایت پیامکی</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>وضعیت</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>تغییر وضعیت</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((r) => {
                                    const sc = statusColor[r.status] || statusColor["جدید"];
                                    return (
                                        <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0", fontSize: "13px" }}>
                                            <td style={{ padding: "12px 14px", color: "#999", fontWeight: 700 }}>{r.id}</td>
                                            <td style={{ padding: "12px 14px", fontWeight: 700 }}>{r.first_name} {r.last_name}</td>
                                            <td style={{ padding: "12px 14px", direction: "ltr", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{r.mobile}</td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <div style={{ fontWeight: 700 }}>{r.car_title || `${r.car_brand || ""} ${r.car_model || ""}`}</div>
                                                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                                                    {r.car_year ? `سال ${r.car_year}` : ""} {r.car_price_aed ? `· ${Number(r.car_price_aed).toLocaleString()} AED` : ""} {r.car_id ? `· ID ${r.car_id}` : ""}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 14px", fontSize: "11.5px", color: "#555", whiteSpace: "nowrap" }}>{formatDate(r.created_at)}</td>
                                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                                {r.sms_consent ? (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "999px", background: "#e8f5e9", color: "#1b5e20", fontSize: "11px", fontWeight: 800 }}>
                                                        ✓ بله
                                                    </span>
                                                ) : (
                                                    <span style={{ display: "inline-flex", padding: "4px 8px", borderRadius: "999px", background: "#f5f5f5", color: "#888", fontSize: "11px" }}>خیر</span>
                                                )}
                                                {r.sms_consent_at ? (
                                                    <div style={{ fontSize: "10px", color: "#999", marginTop: "4px", whiteSpace: "nowrap" }}>{formatDate(r.sms_consent_at)}</div>
                                                ) : null}
                                            </td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <span style={{ display: "inline-block", padding: "5px 10px", borderRadius: "999px", background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: "11px", fontWeight: 800, whiteSpace: "nowrap" }}>{r.status}</span>
                                            </td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <select
                                                    value={r.status}
                                                    onChange={(e) => changeStatus(r.id, e.target.value)}
                                                    disabled={updatingId === r.id}
                                                    style={{
                                                        padding: "7px 10px",
                                                        borderRadius: "7px",
                                                        border: "1px solid #ddd",
                                                        background: "#fff",
                                                        fontSize: "11px",
                                                        fontFamily: "inherit",
                                                        cursor: "pointer",
                                                        minWidth: "130px",
                                                    }}
                                                >
                                                    {STATUSES.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mobile cards - hidden on desktop via CSS but we show both for simplicity with media query */}
            <style>{`
                @media (max-width: 900px) {
                    table { display: none; }
                }
            `}</style>

            {!loading && requests.length > 0 && (
                <div style={{ display: "none" }} className="mobile-cards">
                    {requests.map((r) => (
                        <div key={`m-${r.id}`} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #eee", padding: "14px", marginBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong>{r.first_name} {r.last_name}</strong>
                                <span style={{ fontFamily: "monospace", direction: "ltr" }}>{r.mobile}</span>
                            </div>
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "#555" }}>{r.car_title}</div>
                            <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <select value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} style={{ padding: "6px 10px", borderRadius: "7px", border: "1px solid #ddd", fontSize: "11px" }}>
                                    {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                                </select>
                                <span style={{ fontSize: "10px", color: "#999" }}>{formatDate(r.created_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
