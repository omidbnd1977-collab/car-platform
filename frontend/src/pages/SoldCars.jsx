import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import CarCard from "../components/CarCard";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";

export default function SoldCars() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCar, setSelectedCar] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await api.get("/cars/sold");
                const data = res?.data;
                const list = Array.isArray(data) ? data : Array.isArray(data?.cars) ? data.cars : [];
                if (!mounted) return;
                setCars(list);
            } catch (e) {
                if (!mounted) return;
                setError(e?.response?.data?.error || "خطا در بارگذاری خودروهای فروخته شده");
                setCars([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return cars;
        return cars.filter((c) => {
            const brand = String(c.brand || "").toLowerCase();
            const model = String(c.model || "").toLowerCase();
            const year = String(c.year || "");
            return brand.includes(q) || model.includes(q) || year.includes(q);
        });
    }, [cars, search]);

    const totalValue = useMemo(() => {
        return cars.reduce((sum, c) => sum + (Number(c.price_aed) || 0), 0);
    }, [cars]);

    const formatDate = (d) => {
        if (!d) return "-";
        try { return new Date(d).toLocaleDateString("fa-IR", { dateStyle: "medium" }); } catch { return String(d).slice(0,10); }
    };

    if (selectedCar) {
        const img = (() => {
            const images = Array.isArray(selectedCar.images) ? selectedCar.images : [];
            const primary = images.find((i) => i.is_primary) || images[0];
            return primary ? getImageUrl(primary.image_url) : "";
        })();
        return (
            <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "Tahoma, Arial, sans-serif", padding: "28px" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                    <button onClick={() => setSelectedCar(null)} style={{ padding: "10px 18px", borderRadius: "9px", border: "1px solid #333", background: "#111", color: "#fff", cursor: "pointer", marginBottom: "20px" }}>← بازگشت</button>
                    <div style={{ background: "#111", borderRadius: "20px", overflow: "hidden", border: "1px solid #222" }}>
                        {img && <img src={img} alt="" style={{ width: "100%", height: "420px", objectFit: "cover" }} />}
                        <div style={{ padding: "26px" }}>
                            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                                <span style={{ background: "#c62828", color: "#fff", padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 900 }}>فروخته شد</span>
                                <span style={{ background: "#222", color: "#aaa", padding: "6px 14px", borderRadius: "999px", fontSize: "12px" }}>{formatDate(selectedCar.sold_at || selectedCar.updated_at)}</span>
                            </div>
                            <h1 style={{ margin: "0 0 10px", fontSize: "32px" }}>{selectedCar.brand} {selectedCar.model} {selectedCar.year}</h1>
                            <div style={{ color: "#d4af37", fontSize: "22px", fontWeight: 900 }}>{Number(selectedCar.price_aed || 0).toLocaleString()} AED</div>
                            <div style={{ marginTop: "18px", color: "#aaa", lineHeight: "1.9", fontSize: "14px", whiteSpace: "pre-wrap" }}>{selectedCar.description || "—"}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "Tahoma, Arial, sans-serif", direction: "rtl" }}>
            {/* Header */}
            <div style={{ position: "relative", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)", borderBottom: "1px solid rgba(212,175,55,0.18)", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 20%, rgba(212,175,55,0.08) 0%, transparent 60%)" }} />
                <div style={{ maxWidth: "1450px", margin: "0 auto", padding: "42px 28px 32px", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "18px" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                                <button onClick={() => { window.location.href = "/"; }} style={{ padding: "9px 16px", borderRadius: "9px", border: "1px solid #333", background: "#111", color: "#fff", cursor: "pointer", fontSize: "12px" }}>← بازگشت به خانه</button>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c62828", boxShadow: "0 0 10px #c62828" }} />
                                <span style={{ color: "#777", fontSize: "11px", letterSpacing: "2px", fontWeight: 800 }}>SOLD ARCHIVE</span>
                            </div>
                            <h1 style={{ margin: 0, fontSize: "38px", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                                خودروهای <span style={{ color: "#d4af37" }}>فروخته شده</span>
                            </h1>
                            <p style={{ margin: "10px 0 0", color: "#888", fontSize: "13px", maxWidth: "520px", lineHeight: "1.8" }}>
                                آرشیو حرفه‌ای خودروهایی که با موفقیت به فروش رسیده‌اند. این خودروها از لیست اصلی حذف شده و فقط برای نمایش سوابق و اعتماد مشتریان نگهداری می‌شوند.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "14px 18px", minWidth: "120px" }}>
                                <div style={{ color: "#777", fontSize: "10px", letterSpacing: "1.5px", fontWeight: 800, marginBottom: "6px" }}>تعداد فروش</div>
                                <div style={{ fontSize: "26px", fontWeight: 900 }}>{cars.length}</div>
                                <div style={{ color: "#d4af37", fontSize: "11px", marginTop: "4px" }}>دستگاه</div>
                            </div>
                            <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: "14px", padding: "14px 18px", minWidth: "150px" }}>
                                <div style={{ color: "#b89a2a", fontSize: "10px", letterSpacing: "1.5px", fontWeight: 800, marginBottom: "6px" }}>ارزش کل فروش</div>
                                <div style={{ fontSize: "20px", fontWeight: 900, color: "#d4af37" }}>{totalValue.toLocaleString()} AED</div>
                                <div style={{ color: "#777", fontSize: "11px", marginTop: "4px" }}>مجموع</div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div style={{ marginTop: "26px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "420px" }}>
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو برند، مدل، سال..." style={{ width: "100%", padding: "13px 16px 13px 42px", borderRadius: "12px", border: "1px solid #2a2a2a", background: "#111", color: "#fff", fontSize: "13px", outline: "none" }} />
                            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#555" }}>⌕</span>
                        </div>
                        <div style={{ color: "#555", fontSize: "12px" }}>{filtered.length} خودرو</div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main style={{ maxWidth: "1450px", margin: "0 auto", padding: "28px" }}>
                {loading ? (
                    <div style={{ minHeight: "300px", display: "grid", placeItems: "center", background: "#0d0d0d", border: "1px solid #222", borderRadius: "18px", color: "#888" }}>در حال بارگذاری آرشیو فروش...</div>
                ) : error ? (
                    <div style={{ padding: "30px", background: "#1a0a0a", border: "1px solid #422", borderRadius: "14px", color: "#ff8d8d", textAlign: "center" }}>{error}</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: "70px 20px", textAlign: "center", background: "#0d0d0d", border: "1px solid #222", borderRadius: "18px" }}>
                        <div style={{ fontSize: "48px", marginBottom: "14px" }}>🏁</div>
                        <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>هنوز خودروی فروخته شده‌ای نیست</h3>
                        <p style={{ margin: 0, color: "#777", fontSize: "13px" }}>وقتی خودرویی را در پنل ادمین روی «فروخته شد» بگذارید، اینجا نمایش داده می‌شود.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "22px" }}>
                        {filtered.map((car) => (
                            <div key={car.id} style={{ position: "relative", background: "#111", borderRadius: "18px", overflow: "hidden", border: "1px solid #222", transition: "transform 0.2s" }}>
                                {/* Sold Ribbon */}
                                <div style={{ position: "absolute", top: "14px", right: "14px", zIndex: 2, display: "flex", gap: "6px" }}>
                                    <span style={{ background: "#c62828", color: "#fff", fontSize: "10px", fontWeight: 900, padding: "5px 12px", borderRadius: "999px", letterSpacing: "1px", boxShadow: "0 4px 14px rgba(198,40,40,0.4)" }}>فروخته شد</span>
                                </div>
                                <div style={{ position: "absolute", top: "14px", left: "14px", zIndex: 2 }}>
                                    <span style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", color: "#aaa", fontSize: "10px", padding: "5px 10px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.1)" }}>{formatDate(car.sold_at || car.updated_at)}</span>
                                </div>
                                <div style={{ height: "220px", background: "#0a0a0a", overflow: "hidden", position: "relative" }}>
                                    {(() => {
                                        const images = Array.isArray(car.images) ? car.images : [];
                                        const primary = images.find((i) => i.is_primary) || images[0];
                                        const url = primary ? getImageUrl(primary.image_url) : "";
                                        return url ? (
                                            <img src={url} alt={`${car.brand} ${car.model}`} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.15) brightness(0.85)" }} />
                                        ) : (
                                            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#555" }}>بدون تصویر</div>
                                        );
                                    })()}
                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />
                                    <div style={{ position: "absolute", bottom: "12px", right: "12px", left: "12px", display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                                        <div>
                                            <div style={{ color: "#fff", fontWeight: 900, fontSize: "16px", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{car.brand} {car.model}</div>
                                            <div style={{ color: "#aaa", fontSize: "12px" }}>{car.year} · {car.city || dealerConfig.city}</div>
                                        </div>
                                        <div style={{ background: "#d4af37", color: "#000", fontWeight: 900, fontSize: "12px", padding: "6px 12px", borderRadius: "999px" }}>{Number(car.price_aed || 0).toLocaleString()} AED</div>
                                    </div>
                                </div>
                                <div style={{ padding: "14px 16px", display: "flex", gap: "8px" }}>
                                    <button onClick={() => setSelectedCar(car)} style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>جزئیات فروش</button>
                                    <button onClick={() => window.location.href = "/"} style={{ padding: "10px 14px", borderRadius: "9px", border: "1px solid #333", background: "transparent", color: "#777", cursor: "pointer", fontSize: "12px" }}>خانه</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer style={{ textAlign: "center", padding: "30px", borderTop: "1px solid #1a1a1a", color: "#555", fontSize: "11px", letterSpacing: "1px" }}>
                آرشیو فروش · {dealerConfig.name} · {cars.length} خودروی فروخته شده
            </footer>

            <style>{`
                @media (max-width: 1050px) { main > div { grid-template-columns: repeat(2, minmax(0,1fr)) !important; } }
                @media (max-width: 650px) { main > div { grid-template-columns: 1fr !important; } }
            `}</style>
        </div>
    );
}
