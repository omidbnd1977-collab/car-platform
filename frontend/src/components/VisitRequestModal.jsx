import React, { useEffect, useState } from "react";
import { apiUrl } from "../utils/apiBase";

function normalizeMobile(input) {
    if (!input) return "";
    let s = String(input).trim().replace(/[\s\-\(\)]/g, "");
    if (s.startsWith("+98")) s = "0" + s.slice(3);
    if (s.startsWith("0098")) s = "0" + s.slice(4);
    if (s.startsWith("98") && s.length >= 12) s = "0" + s.slice(2);
    if (/^9\d{9}$/.test(s)) s = "0" + s;
    return s;
}

export default function VisitRequestModal({ open, onClose, car }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [mobile, setMobile] = useState("");
    const [smsConsent, setSmsConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const brand = car?.brand_name || car?.brand || "";
    const model = car?.model_name || car?.model || "";
    const year = car?.year || "";
    const carTitle = `${brand} ${model} ${year}`.trim() || "خودروی انتخابی";
    const carId = car?.id;

    useEffect(() => {
        if (open) {
            setError("");
            setSuccess(false);
            setLoading(false);
            // body scroll lock
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // ESC close
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const validate = () => {
        if (String(firstName).trim().length < 2) return "نام را صحیح وارد کنید (حداقل ۲ حرف).";
        if (String(lastName).trim().length < 2) return "نام خانوادگی را صحیح وارد کنید.";
        const m = normalizeMobile(mobile);
        if (!/^09\d{9}$/.test(m)) return "شماره موبایل نامعتبر است. مثال: 09123456789";
        if (!carId) return "خودرو مشخص نیست.";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const v = validate();
        if (v) {
            setError(v);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const payload = {
                first_name: String(firstName).trim(),
                last_name: String(lastName).trim(),
                mobile: normalizeMobile(mobile),
                car_id: carId,
                sms_consent: Boolean(smsConsent),
            };

            const res = await fetch(apiUrl("visit-requests"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data?.error || "خطا در ثبت درخواست.");
            }

            setSuccess(true);
            setFirstName("");
            setLastName("");
            setMobile("");
            setSmsConsent(false);

            setTimeout(() => {
                setSuccess(false);
                onClose?.();
            }, 2500);

        } catch (err) {
            setError(err?.message || "خطا در ثبت درخواست. دوباره تلاش کنید.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            dir="rtl"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "480px",
                    background: "linear-gradient(145deg, #16130c 0%, #0b0906 55%, #151006 100%)",
                    border: "1px solid rgba(212,175,55,0.38)",
                    borderRadius: "22px",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.10), 0 0 40px rgba(212,175,55,0.14)",
                    overflow: "hidden",
                    animation: "modalIn 0.45s cubic-bezier(.22,1,.36,1)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "22px 22px 16px",
                        borderBottom: "1px solid rgba(212,175,55,0.14)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                color: "#d4af37",
                                fontSize: "10px",
                                fontWeight: 900,
                                letterSpacing: "2px",
                                marginBottom: "6px",
                            }}
                        >
                            PREMIUM REQUEST
                        </div>
                        <div
                            style={{
                                color: "#f5e6c8",
                                fontSize: "18px",
                                fontWeight: 900,
                                lineHeight: 1.3,
                                fontFamily: "'Playfair Display', Tahoma, serif",
                            }}
                        >
                            تماس / درخواست بازدید
                        </div>
                        <div
                            style={{
                                marginTop: "6px",
                                color: "#c9a45c",
                                fontSize: "13px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {carTitle}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن"
                        style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "999px",
                            border: "1px solid rgba(212,175,55,0.22)",
                            background: "rgba(0,0,0,0.35)",
                            color: "#d4af37",
                            cursor: "pointer",
                            fontSize: "18px",
                            lineHeight: 1,
                            display: "grid",
                            placeItems: "center",
                            flex: "0 0 38px",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} style={{ padding: "20px 22px 22px" }}>
                    {success ? (
                        <div
                            role="status"
                            style={{
                                padding: "18px",
                                borderRadius: "14px",
                                background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))",
                                border: "1px solid rgba(212,175,55,0.28)",
                                color: "#f5e6a6",
                                textAlign: "center",
                                fontSize: "15px",
                                fontWeight: 800,
                                lineHeight: 1.9,
                            }}
                        >
                            <div style={{ fontSize: "32px", marginBottom: "6px" }}>✓</div>
                            درخواست شما با موفقیت ثبت شد
                            <div style={{ marginTop: "6px", color: "#9a8d72", fontSize: "12px", fontWeight: 600 }}>
                                به زودی با شما تماس می‌گیریم
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={labelStyle}>نام *</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="مثلاً علی"
                                        style={inputStyle}
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>نام خانوادگی *</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="مثلاً محمدی"
                                        style={inputStyle}
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                                <label style={labelStyle}>شماره موبایل *</label>
                                <input
                                    type="tel"
                                    dir="ltr"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder="09123456789"
                                    style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
                                    autoComplete="tel"
                                    inputMode="numeric"
                                />
                                <div style={{ marginTop: "6px", color: "#6d6655", fontSize: "10.5px", lineHeight: 1.6 }}>
                                    شماره شما محرمانه می‌ماند و فقط برای همین درخواست استفاده می‌شود.
                                </div>
                            </div>

                            {/* SMS consent */}
                            <label
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    alignItems: "flex-start",
                                    padding: "12px 12px",
                                    borderRadius: "12px",
                                    background: smsConsent ? "rgba(212,175,55,0.10)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${smsConsent ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}`,
                                    cursor: "pointer",
                                    marginBottom: "16px",
                                    transition: "all 0.25s ease",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={smsConsent}
                                    onChange={(e) => setSmsConsent(e.target.checked)}
                                    style={{
                                        marginTop: "3px",
                                        width: "18px",
                                        height: "18px",
                                        accentColor: "#d4af37",
                                        flex: "0 0 18px",
                                    }}
                                />
                                <span style={{ color: "#cbb88f", fontSize: "12.5px", lineHeight: 1.8, fontWeight: 600 }}>
                                    مایلم اخبار، پیشنهادها و خودروهای جدید را از طریق پیامک دریافت کنم.
                                </span>
                            </label>

                            {error ? (
                                <div
                                    role="alert"
                                    style={{
                                        marginBottom: "14px",
                                        padding: "10px 12px",
                                        borderRadius: "10px",
                                        background: "rgba(198,40,40,0.12)",
                                        border: "1px solid rgba(198,40,40,0.28)",
                                        color: "#ffb4b4",
                                        fontSize: "12.5px",
                                        lineHeight: 1.8,
                                        fontWeight: 600,
                                    }}
                                >
                                    {error}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    height: "46px",
                                    borderRadius: "12px",
                                    border: "1px solid #d4af37",
                                    background: loading
                                        ? "#a9823f"
                                        : "linear-gradient(135deg, #e8d27a 0%, #d4af37 25%, #c9a45c 50%, #a9823f 100%)",
                                    color: "#111",
                                    fontSize: "14px",
                                    fontWeight: 900,
                                    letterSpacing: "0.2px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    boxShadow: "0 8px 22px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.4)",
                                    transition: "filter 0.25s ease, transform 0.2s ease",
                                    opacity: loading ? 0.8 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) e.currentTarget.style.filter = "brightness(1.08)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.filter = "brightness(1)";
                                }}
                            >
                                {loading ? "در حال ثبت..." : "ثبت درخواست"}
                            </button>

                            <div style={{ marginTop: "12px", textAlign: "center", color: "#6d6655", fontSize: "10.5px", lineHeight: 1.7 }}>
                                با ثبت درخواست، کارشناسان ما در اسرع وقت با شما تماس می‌گیرند.
                            </div>
                        </>
                    )}
                </form>
            </div>

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: translateY(18px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @media (max-width: 520px) {
                    div[role="dialog"] > div {
                        border-radius: 18px !important;
                        max-width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
}

const labelStyle = {
    display: "block",
    marginBottom: "7px",
    color: "#9a8d72",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.6px",
};

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    height: "44px",
    padding: "0 12px",
    borderRadius: "11px",
    border: "1px solid rgba(212,175,55,0.22)",
    background: "rgba(0,0,0,0.42)",
    color: "#f5e6c8",
    fontSize: "14px",
    outline: "none",
    fontFamily: "Tahoma, Arial, sans-serif",
    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
};
