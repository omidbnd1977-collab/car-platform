import React, { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import dealerConfig, { tenantSlug } from "../config/dealerConfig";

export default function QRPrintSheet() {
    const origin = useMemo(() => {
        try {
            return typeof window !== "undefined" ? window.location.origin : "https://car-platform-9vv7.onrender.com";
        } catch {
            return "https://car-platform-9vv7.onrender.com";
        }
    }, []);
    const qrUrl = useMemo(() => {
        const slug = tenantSlug || "qeshm";
        const host = typeof window !== "undefined" ? window.location.hostname : "";
        const isBase = host.includes("car-platform-9vv7") || host === "localhost" || host === "127.0.0.1" || host === "";
        if (isBase) {
            return `${origin}/?dealer=${slug}`;
        }
        return origin;
    }, [origin]);
    const companyName = dealerConfig.name || "QESHM SMART AUTO";
    const phone = dealerConfig.phone || "+989177611324";
    return (
        <div className="qr-print-root" style={{ minHeight: "100vh", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Tahoma, Arial, sans-serif" }}>
            <style>{`@media print { body { background: white !important; } .qr-print-root { background: white !important; padding: 0 !important; } .no-print { display: none !important; } .qr-a4 { box-shadow: none !important; border: 3px solid #d4af37 !important; } }`}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                <button className="no-print" type="button" onClick={() => window.print()} style={{ padding: "12px 24px", borderRadius: "10px", border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 800, cursor: "pointer" }}>🖨️ پرینت این برگه A4</button>
                <div className="qr-a4" style={{ width: "210mm", minHeight: "297mm", background: "#ffffff", border: "4px solid transparent", backgroundImage: "linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #d4af37 0%, #a9823f 25%, #f5e6a6 50%, #d4af37 75%, #a9823f 100%)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box", borderRadius: "18px", boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 0 8px rgba(212,175,55,0.08)", padding: "18mm", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", textAlign: "center", position: "relative", overflow: "hidden" }}>
                    <div style={{ width: "100%" }}>
                        <div style={{ width: "72px", height: "4px", background: "linear-gradient(90deg, #d4af37, #a9823f)", borderRadius: "999px", margin: "0 auto 18px" }} />
                        <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 900, lineHeight: 1.2, color: "#111", fontFamily: "'Playfair Display', Tahoma, serif" }}>{companyName}</h1>
                        <div style={{ marginTop: "14px", fontSize: "18px", fontWeight: 800, color: "#a97f2f" }}>دستیار هوشمند فروش خودرو</div>
                        <div style={{ marginTop: "8px", width: "80px", height: "2px", background: "linear-gradient(90deg, transparent, #d4af37, transparent)", marginInline: "auto" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                        <div style={{ padding: "14px", borderRadius: "20px", background: "#fff", border: "2px solid rgba(212,175,55,0.35)", boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}>
                            <QRCodeSVG value={qrUrl} size={220} bgColor="#ffffff" fgColor="#111111" level="H" includeMargin={true} />
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", direction: "ltr", wordBreak: "break-all" }}>{qrUrl}</div>
                        <div style={{ fontSize: "13px", color: "#444", fontWeight: 700 }}>با دوربین گوشی اسکن کنید — مستقیم وارد سایت می‌شوید</div>
                    </div>
                    <div style={{ width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px", fontSize: "12px", color: "#555" }}>
                            <span style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.20)" }}>📞 {phone}</span>
                            <span style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>🌐 {origin.replace(/^https?:\/\//, "")}</span>
                        </div>
                        <div style={{ height: "4px", background: "linear-gradient(90deg, #d4af37 0%, #a9823f 50%, #d4af37 100%)", borderRadius: "999px", marginBottom: "12px" }} />
                        <div style={{ fontSize: "10px", color: "#999", letterSpacing: "1px" }}>{companyName} • SMART AUTO PLATFORM</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
