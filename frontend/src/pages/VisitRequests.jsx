import React, { useEffect, useState } from "react";
import { apiUrl } from "../utils/apiBase";
import { adminFetch } from "../utils/adminAuth";

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
    const [bulkMsg, setBulkMsg] = useState("");
    const [bulkLoading, setBulkLoading] = useState(false);
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [selectedMobiles, setSelectedMobiles] = useState(new Set());

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
            if (!res.ok) throw new Error(data?.error || `خطا ${res.status}`);
            setRequests(Array.isArray(data?.requests) ? data.requests : []);
            setStats(Array.isArray(data?.stats) ? data.stats : []);
        } catch (e) {
            setError(e?.message || "خطا در بارگذاری");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filterStatus]);

    const handleSearch = (e) => { e.preventDefault(); load(); };

    const changeStatus = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            setError(""); setNotice("");
            const res = await adminFetch(apiUrl(`visit-requests/${id}/status`), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "خطا در بروزرسانی");
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
            setNotice(`وضعیت درخواست #${id} به «${newStatus}» تغییر کرد.`);
        } catch (e) {
            setError(e?.message || "خطا در تغییر وضعیت");
        } finally {
            setUpdatingId(null);
        }
    };

    const exportCsv = async (onlyConsented) => {
        try {
            setError(""); setNotice("");
            const q = onlyConsented ? "?consent=true" : "";
            const url = apiUrl(`visit-requests/export/csv${q}`);
            const res = await adminFetch(url);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || `خطا ${res.status}`);
            }
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `visit-requests-${onlyConsented ? "consent-" : ""}${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            setNotice(onlyConsented ? "CSV رضایت‌دار دانلود شد." : "CSV همه دانلود شد.");
        } catch (e) {
            setError(e?.message || "خطا در خروجی CSV");
        }
    };

    const consentedUnique = (() => {
        const map = new Map();
        for (const r of requests) {
            if (!r.sms_consent) continue;
            if (!map.has(r.mobile)) map.set(r.mobile, r);
        }
        return Array.from(map.values());
    })();

    const toggleMobile = (mobile) => {
        setSelectedMobiles((prev) => {
            const next = new Set(prev);
            if (next.has(mobile)) next.delete(mobile);
            else next.add(mobile);
            return next;
        });
    };

    const selectAllConsented = () => {
        setSelectedMobiles(new Set(consentedUnique.map((r) => r.mobile)));
    };

    const sendBulk = async () => {
        if (!bulkMsg.trim()) { setError("متن پیامک را وارد کنید."); return; }
        const targetMobiles = showSelectModal && selectedMobiles.size > 0 ? Array.from(selectedMobiles) : null;
        try {
            setBulkLoading(true); setError(""); setNotice("");
            const body = { message: bulkMsg.trim() };
            if (targetMobiles) body.mobiles = targetMobiles;
            const res = await adminFetch(apiUrl("visit-requests/bulk-sms"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || `خطا ${res.status}`);
            const errs = (data.results || []).filter((r)=>!r.ok).map((r)=>`${r.mobile}: ${r.error}`).join(" | ").slice(0, 800);
            setNotice(`ارسال: ${data.sent} موفق، ${data.failed} ناموفق از ${data.total}. ${errs ? "خطا: "+errs : ""}`);
            console.log("BULK FULL:", data);
            if (data.failed === 0) {
                setBulkMsg(""); setShowSelectModal(false); setSelectedMobiles(new Set());
            }
        } catch (e) {
            setError(e?.message || "خطا در ارسال گروهی");
        } finally {
            setBulkLoading(false);
        }
    };

    const total = requests.length;
    const consentedCount = requests.filter((r) => r.sms_consent).length;

    return (
        <div style={{ fontFamily: "Tahoma, Arial, sans-serif", direction: "rtl" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "22px" }}>درخواست‌های بازدید</h2>
                    <div style={{ color: "#777", fontSize: "12px", marginTop: "6px" }}>
                        {total} درخواست · رضایت‌دار: {consentedCount} · {stats.map((s) => `${s.status}: ${s.count}`).join(" · ")}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                        <option value="">همه وضعیت‌ها</option>
                        {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو..." style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd", width: "200px", fontSize: "13px", fontFamily: "inherit" }} />
                        <button type="submit" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>جستجو</button>
                    </form>
                    <button type="button" onClick={load} style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>↻ تازه‌سازی</button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px", background: "#fff", padding: "14px", borderRadius: "10px", border: "1px solid #e5e5e5" }}>
                <button type="button" onClick={() => exportCsv(true)} style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #2e7d32", background: "#e8f5e9", color: "#1b5e20", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}>📥 CSV رضایت‌دار ({consentedCount})</button>
                <button type="button" onClick={() => exportCsv(false)} style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>📥 همه شماره‌ها</button>
                <button type="button" onClick={() => { setShowSelectModal(true); setSelectedMobiles(new Set(consentedUnique.map((r)=>r.mobile))); }} style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #0d47a1", background: "#e3f2fd", color: "#0d47a1", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}>📋 انتخاب و ارسال گروهی</button>
            </div>

            {showSelectModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
                    <div style={{ background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "560px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "16px 18px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong>انتخاب شماره‌ها</strong>
                            <button type="button" onClick={() => setShowSelectModal(false)} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: "7px", padding: "6px 10px", cursor: "pointer" }}>✕ بستن</button>
                        </div>
                        <div style={{ padding: "12px 16px", background: "#f9f9f9", borderBottom: "1px solid #eee", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#555" }}>{selectedMobiles.size} از {consentedUnique.length}</span>
                            <button type="button" onClick={selectAllConsented} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "11px" }}>انتخاب همه</button>
                            <button type="button" onClick={() => setSelectedMobiles(new Set())} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "11px" }}>حذف انتخاب</button>
                        </div>
                        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
                            {consentedUnique.length === 0 ? <div style={{ padding: "20px", textAlign: "center", color: "#888", fontSize: "13px" }}>هیچ شماره رضایت‌داری نیست</div> :
                                consentedUnique.map((r) => (
                                    <label key={r.mobile} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}>
                                        <input type="checkbox" checked={selectedMobiles.has(r.mobile)} onChange={() => toggleMobile(r.mobile)} />
                                        <span style={{ fontFamily: "monospace", direction: "ltr", fontWeight: 700 }}>{r.mobile}</span>
                                        <span style={{ fontSize: "12px" }}>{r.first_name} {r.last_name}</span>
                                    </label>
                                ))
                            }
                        </div>
                        <div style={{ padding: "12px 16px", borderTop: "1px solid #eee", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <input type="text" value={bulkMsg} onChange={(e) => setBulkMsg(e.target.value)} placeholder="متن پیامک گروهی..." style={{ flex: "1 1 260px", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", fontFamily: "inherit" }} />
                            <button type="button" disabled={bulkLoading || selectedMobiles.size===0} onClick={sendBulk} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: bulkLoading ? "#999" : "#111", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}>{bulkLoading ? "در حال ارسال..." : `📤 ارسال به ${selectedMobiles.size} نفر`}</button>
                        </div>
                    </div>
                </div>
            )}

            {notice && (<div style={{ padding: "12px 16px", marginBottom: "16px", background: "#e8f5e9", color: "#1b5e20", borderRadius: "8px", fontSize: "12px" }}>{notice}</div>)}
            {error && (<div style={{ padding: "12px 16px", marginBottom: "16px", background: "#ffebee", color: "#c62828", borderRadius: "8px", fontSize: "12px" }}>{error}</div>)}

            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid #eee", color: "#888" }}>در حال بارگذاری...</div>
            ) : requests.length === 0 ? (
                <div style={{ padding: "50px 20px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid #eee", color: "#888" }}>
                    <div style={{ fontSize: "16px", marginBottom: "8px" }}>درخواستی یافت نشد</div>
                </div>
            ) : (
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e5e5", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                            <thead>
                                <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee", textAlign: "right", fontSize: "11px", color: "#777" }}>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>#</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>نام</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>موبایل</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>خودرو</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>تاریخ</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>رضایت</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>وضعیت</th>
                                    <th style={{ padding: "12px 14px", fontWeight: 800 }}>تغییر</th>
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
                                            <td style={{ padding: "12px 14px" }}>{r.car_title || `${r.car_brand || ""} ${r.car_model || ""}`}</td>
                                            <td style={{ padding: "12px 14px", fontSize: "11.5px", color: "#555", whiteSpace: "nowrap" }}>{formatDate(r.created_at)}</td>
                                            <td style={{ padding: "12px 14px", textAlign: "center" }}>{r.sms_consent ? (<span style={{ display: "inline-flex", padding: "4px 8px", borderRadius: "999px", background: "#e8f5e9", color: "#1b5e20", fontSize: "11px", fontWeight: 800 }}>✓ بله</span>) : (<span style={{ display: "inline-flex", padding: "4px 8px", borderRadius: "999px", background: "#f5f5f5", color: "#888", fontSize: "11px" }}>خیر</span>)}</td>
                                            <td style={{ padding: "12px 14px" }}><span style={{ display: "inline-block", padding: "5px 10px", borderRadius: "999px", background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: "11px", fontWeight: 800 }}>{r.status}</span></td>
                                            <td style={{ padding: "12px 14px" }}><select value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} disabled={updatingId === r.id} style={{ padding: "7px 10px", borderRadius: "7px", border: "1px solid #ddd", background: "#fff", fontSize: "11px", fontFamily: "inherit", cursor: "pointer", minWidth: "120px" }}>{STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}</select></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
