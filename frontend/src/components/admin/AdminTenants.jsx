import React, { useEffect, useState } from "react";
import API_BASE from "../../utils/apiBase.js";
import { adminHeaders } from "../../utils/adminAuth.js";

export default function AdminTenants({ onClose }) {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        slug: "",
        name: "",
        short_name: "",
        city: "Qeshm",
        country: "Iran",
        city_fa: "قشم",
        country_fa: "ایران",
        phone: "",
        whatsapp: "",
        email: "",
        instagram: "",
        address: "",
        logo: "",
        primary_color: "#d4af37",
        secondary_color: "#050505",
        currency: "AED",
        admin_mobile: "",
        sms_sender: "2000660110",
    });

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/tenants/admin/all`, { headers: adminHeaders() });
            const data = await res.json();
            setTenants(data.tenants || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTenants(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === "name" && !form.slug) {
            const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            setForm(prev => ({ ...prev, slug }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.name.trim()) { setError("نام شاخه الزامی است"); return; }
        if (!form.slug.trim()) { setError("اسلاگ الزامی است"); return; }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/tenants`, {
                method: "POST",
                headers: { ...adminHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "خطا در ساخت شاخه");
            setShowForm(false);
            setForm({ slug: "", name: "", short_name: "", city: "Qeshm", country: "Iran", city_fa: "قشم", country_fa: "ایران", phone: "", whatsapp: "", email: "", instagram: "", address: "", logo: "", primary_color: "#d4af37", secondary_color: "#050505", currency: "AED", admin_mobile: "", sms_sender: "2000660110" });
            fetchTenants();
            alert(`شاخه ${data.tenant.name} ساخته شد! اسلاگ: ${data.tenant.slug}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`شاخه ${name} غیرفعال شود؟`)) return;
        try {
            const res = await fetch(`${API_BASE}/tenants/${id}`, { method: "DELETE", headers: adminHeaders() });
            if (!res.ok) throw new Error("خطا");
            fetchTenants();
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
            <div style={{ width: "95vw", maxWidth: "1100px", maxHeight: "95vh", height: "95vh", background: "#f8f8f8", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ padding: "16px 24px", background: "#111", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "22px" }}>🏢</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: "16px" }}>مدیریت شاخه‌ها</div>
                            <div style={{ fontSize: "11px", color: "#aaa" }}>{tenants.length} شاخه فعال</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => setShowForm(!showForm)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#d4af37", color: "#000", fontWeight: 800, cursor: "pointer" }}>{showForm ? "بستن فرم" : "➕ شاخه جدید"}</button>
                        <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #333", background: "transparent", color: "#fff", cursor: "pointer" }}>✕</button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", gap: "20px", flexDirection: showForm ? "row" : "column" }}>
                    {showForm && (
                        <div style={{ flex: "0 0 420px", background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e5e5", height: "fit-content" }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 800 }}>➕ ساخت شاخه جدید</h3>
                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div><label style={{ fontSize: "11px", fontWeight: 700 }}>نام شاخه *</label><input name="name" value={form.name} onChange={handleChange} placeholder="SMART BRAND DUBAI" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
                                    <div><label style={{ fontSize: "11px", fontWeight: 700 }}>اسلاگ * (انگلیسی)</label><input name="slug" value={form.slug} onChange={handleChange} placeholder="dubai" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", direction: "ltr" }} /></div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div><label style={{ fontSize: "11px" }}>نام کوتاه</label><input name="short_name" value={form.short_name} onChange={handleChange} placeholder="SMART DUBAI" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
                                    <div><label style={{ fontSize: "11px" }}>شهر</label><input name="city" value={form.city} onChange={handleChange} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div><label style={{ fontSize: "11px" }}>شماره تماس</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+989177611324" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", direction: "ltr" }} /></div>
                                    <div><label style={{ fontSize: "11px" }}>واتس‌اپ</label><input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="989177611324" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", direction: "ltr" }} /></div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div><label style={{ fontSize: "11px" }}>شماره پیامکی مدیر</label><input name="admin_mobile" value={form.admin_mobile} onChange={handleChange} placeholder="0917..." style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", direction: "ltr" }} /></div>
                                    <div><label style={{ fontSize: "11px" }}>خط پیامکی</label><input name="sms_sender" value={form.sms_sender} onChange={handleChange} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", direction: "ltr" }} /></div>
                                </div>
                                <div><label style={{ fontSize: "11px" }}>ایمیل</label><input name="email" value={form.email} onChange={handleChange} placeholder="info@..." style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", direction: "ltr" }} /></div>
                                <div><label style={{ fontSize: "11px" }}>اینستاگرام</label><input name="instagram" value={form.instagram} onChange={handleChange} placeholder="@smartbrandcar" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", direction: "ltr" }} /></div>
                                <div><label style={{ fontSize: "11px" }}>آدرس شرکت</label><textarea name="address" value={form.address} onChange={handleChange} placeholder="آدرس کامل..." rows={2} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px" }} /></div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                    <div><label style={{ fontSize: "11px" }}>رنگ اصلی</label><input type="color" name="primary_color" value={form.primary_color} onChange={handleChange} style={{ width: "100%", height: "36px", borderRadius: "6px", border: "1px solid #ddd" }} /></div>
                                    <div><label style={{ fontSize: "11px" }}>رنگ دوم</label><input type="color" name="secondary_color" value={form.secondary_color} onChange={handleChange} style={{ width: "100%", height: "36px", borderRadius: "6px", border: "1px solid #ddd" }} /></div>
                                    <div><label style={{ fontSize: "11px" }}>ارز</label><select name="currency" value={form.currency} onChange={handleChange} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}><option>AED</option><option>USD</option><option>IRR</option></select></div>
                                </div>
                                {error && <div style={{ background: "#fee", color: "#c00", padding: "8px", borderRadius: "6px", fontSize: "12px" }}>{error}</div>}
                                <button type="submit" disabled={saving} style={{ padding: "12px", borderRadius: "8px", border: "none", background: saving ? "#999" : "#111", color: "#fff", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "در حال ساخت..." : "✅ ثبت شاخه جدید"}</button>
                                <div style={{ fontSize: "10px", color: "#777", background: "#f5f5f5", padding: "8px", borderRadius: "6px" }}>
                                    بعد از ساخت، برای فعال‌سازی کامل:<br/>
                                    1. Render → سرویس جدید Frontend با VITE_TENANT={form.slug}<br/>
                                    2. بک‌اند جدا با DATABASE_URL جدید<br/>
                                    3. دامنه: {form.slug}.onrender.com
                                </div>
                            </form>
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        {loading ? <div style={{ textAlign: "center", padding: "40px" }}>در حال بارگذاری...</div> : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
                                {tenants.map(t => (
                                    <div key={t.id} style={{ background: "#fff", borderRadius: "12px", padding: "16px", border: "1px solid #e5e5e5" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: t.primary_color || "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>{t.name?.[0] || "?"}</div>
                                            <span style={{ fontSize: "10px", background: t.is_active ? "#e8f5e9" : "#ffebee", color: t.is_active ? "#2e7d32" : "#c62828", padding: "3px 8px", borderRadius: "10px" }}>{t.is_active ? "فعال" : "غیرفعال"}</span>
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "4px" }}>{t.name}</div>
                                        <div style={{ fontSize: "11px", color: "#777", marginBottom: "8px", direction: "ltr" }}>slug: {t.slug} | {t.city} | {t.currency}</div>
                                        <div style={{ fontSize: "11px", color: "#555", display: "flex", flexDirection: "column", gap: "3px" }}>
                                            <span>📞 {t.phone || "-"}</span>
                                            <span>💬 واتس‌اپ: {t.whatsapp || "-"}</span>
                                            <span>📱 مدیر: {t.admin_mobile || "-"}</span>
                                            <span>📧 {t.email || "-"}</span>
                                            <span>📸 {t.instagram || "-"}</span>
                                            <span>📍 {t.address?.slice(0, 40) || "-"}</span>
                                        </div>
                                        <div style={{ marginTop: "12px", display: "flex", gap: "6px" }}>
                                            <a href={`/?dealer=${t.slug}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", padding: "6px", borderRadius: "6px", background: "#f5f5f5", fontSize: "11px", textDecoration: "none", color: "#333" }}>👁️ پیش‌نمایش</a>
                                            <button onClick={() => handleDelete(t.id, t.name)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ffcdd2", background: "#ffebee", color: "#c62828", fontSize: "11px", cursor: "pointer" }}>حذف</button>
                                        </div>
                                    </div>
                                ))}
                                {tenants.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#999" }}>هنوز شاخه‌ای ساخته نشده — دکمه ➕ شاخه جدید را بزن</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
