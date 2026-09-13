import React, { useEffect, useState } from "react";
import dealerConfig from "../config/dealerConfig";
import { getImageUrl } from "../utils/imageUrl";

// ------------------------------------------------------------
// مودال «درخواست بازدید / تماس»
// ------------------------------------------------------------
// دکمه‌ی مربوطه در کارت خودرو (و در صفحه‌ی جزئیات) این مودال را باز
// می‌کند تا کاربر با یک کلیک:
//   • تماس تلفنی بگیرد
//   • پیام واتساپ آماده (شامل برند/مدل/کد خودرو) بفرستد
//   • متن درخواست یا شماره را کپی کند
// راه‌های ارتباطی از dealerConfig (config/tenants/*) خوانده می‌شوند؛
// اگر شماره‌ی خودِ نمایندگی روی خودرو باشد (getCarById) اولویت دارد.
// اگر هیچ راهی ثبت نشده باشد، مودال متن درخواست را آماده می‌کند تا
// کاربر آن را کپی کند (هیچ‌وقت دکمه‌ی بی‌اثر نمی‌ماند).
// ------------------------------------------------------------

function mainImage(car) {
    const images = (Array.isArray(car?.images) ? car.images : []).filter(
        (img) => img?.image_url
    );

    if (!images.length) {
        return "";
    }

    const primary =
        images.find(
            (img) =>
                img?.is_primary === true ||
                String(img?.is_primary).toLowerCase() === "true"
        ) ||
        images.find(
            (img) =>
                car?.primary_image_id != null &&
                String(img.id) === String(car.primary_image_id)
        ) ||
        images[0];

    return getImageUrl(primary?.image_url || "");
}

function digitsOnly(value) {
    return String(value == null ? "" : value).replace(/[^\d]/g, "");
}

function telHref(value) {
    const raw = String(value == null ? "" : value).trim();
    const digits = digitsOnly(raw);

    if (!digits) {
        return "";
    }

    return `tel:${raw.startsWith("+") ? "+" : ""}${digits}`;
}

function ContactModal({ car, onClose }) {
    const brand = String(car?.brand_name || car?.brand || "").trim();
    const model = String(car?.model_name || car?.model || "").trim();
    const title = `${brand} ${model}`.trim() || "این خودرو";

    const phone = String(
        car?.dealership_phone || car?.phone || dealerConfig.phone || ""
    ).trim();

    const whatsappNumber =
        digitsOnly(dealerConfig.whatsapp) || digitsOnly(phone);

    const email = String(dealerConfig.email || "").trim();

    const image = mainImage(car);

    const defaultMessage = [
        `سلام، برای خودروی ${title}`,
        car?.year ? `مدل ${car.year}` : "",
        car?.id ? `(کد ${car.id})` : "",
        "درخواست بازدید حضوری / تماس دارم.",
    ]
        .filter(Boolean)
        .join(" ");

    // پیام به‌صورت مقدار اولیه‌ی استیت ساخته می‌شود؛ مودال هر بار برای
    // یک خودرو باز می‌شود، پس لازم نیست با effect همگام شود.
    const [message, setMessage] = useState(defaultMessage);
    const [copied, setCopied] = useState("");

    // بستن با کلید Escape
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape" && onClose) {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const callHref = telHref(phone);

    const whatsappHref = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
        : "";

    const mailHref = email
        ? `mailto:${email}?subject=${encodeURIComponent(
              `درخواست بازدید ${title}`
          )}&body=${encodeURIComponent(message)}`
        : "";

    const copy = async (value, key) => {
        const text = String(value || "");

        if (!text) {
            return;
        }

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                throw new Error("clipboard-unavailable");
            }
        } catch {
            try {
                const area = document.createElement("textarea");
                area.value = text;
                area.setAttribute("readonly", "");
                area.style.position = "fixed";
                area.style.top = "-1000px";
                area.style.opacity = "0";

                document.body.appendChild(area);
                area.select();
                document.execCommand("copy");
                document.body.removeChild(area);
            } catch {
                /* اگر کلیپ‌بورد در دسترس نبود، کاربر می‌تواند متن را
                   دستی انتخاب و کپی کند. */
            }
        }

        setCopied(key);
        window.setTimeout(() => setCopied(""), 1800);
    };

    const hasDirectContact = Boolean(callHref || whatsappHref || mailHref);

    return (
        <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="درخواست بازدید یا تماس"

            onClick={(event) => {
                if (event.target === event.currentTarget && onClose) {
                    onClose();
                }
            }}

            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,

                background: "rgba(2,2,2,0.72)",
                backdropFilter: "blur(7px)",
                WebkitBackdropFilter: "blur(7px)",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                padding: "18px",
                boxSizing: "border-box",
                overflowY: "auto",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "460px",
                    maxHeight: "92vh",
                    overflowY: "auto",
                    boxSizing: "border-box",

                    background:
                        "linear-gradient(160deg, #111 0%, #080808 100%)",

                    border: "1px solid rgba(212,175,55,0.28)",
                    borderRadius: "20px",

                    padding: "22px",

                    boxShadow: "0 30px 80px rgba(0,0,0,0.65)",

                    fontFamily: "Tahoma, Arial, sans-serif",
                    color: "#fff",
                    direction: "rtl",
                }}
            >
                {/* HEADER */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "16px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                color: "#d4af37",
                                fontSize: "11px",
                                fontWeight: 900,
                                letterSpacing: "1.6px",
                                marginBottom: "6px",
                            }}
                        >
                            REQUEST A VISIT
                        </div>

                        <h3
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: 900,
                                lineHeight: 1.4,
                            }}
                        >
                            درخواست بازدید / تماس
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن"

                        style={{
                            flex: "0 0 auto",
                            width: "34px",
                            height: "34px",

                            border: "1px solid rgba(255,255,255,0.16)",
                            borderRadius: "10px",
                            background: "rgba(255,255,255,0.04)",

                            color: "#fff",
                            fontSize: "17px",
                            fontWeight: 900,
                            lineHeight: 1,

                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* CAR SUMMARY */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",

                        padding: "12px",
                        marginBottom: "16px",

                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.02)",
                    }}
                >
                    {image ? (
                        <img
                            src={image}
                            alt={title}

                            onError={(event) => {
                                event.currentTarget.style.display = "none";
                            }}

                            style={{
                                width: "84px",
                                height: "58px",
                                flex: "0 0 84px",
                                objectFit: "cover",
                                borderRadius: "10px",
                                display: "block",
                                background: "#1a1a1a",
                            }}
                        />
                    ) : null}

                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: "15px",
                                fontWeight: 900,
                                marginBottom: "5px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {title}
                        </div>

                        <div
                            style={{
                                color: "#9a9a9a",
                                fontSize: "12px",
                                fontWeight: 700,
                            }}
                        >
                            {car?.year ? `سال ${car.year}` : ""}
                            {car?.year && car?.id ? " · " : ""}
                            {car?.id ? `کد خودرو ${car.id}` : ""}
                        </div>
                    </div>
                </div>

                {/* MESSAGE */}

                <label
                    htmlFor="contact-request-message"
                    style={{
                        display: "block",
                        color: "#a5a5a5",
                        fontSize: "12px",
                        fontWeight: 800,
                        marginBottom: "7px",
                    }}
                >
                    متن درخواست شما
                </label>

                <textarea
                    id="contact-request-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={3}

                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        resize: "vertical",

                        padding: "12px",
                        marginBottom: "16px",

                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "12px",

                        background: "rgba(0,0,0,0.35)",
                        color: "#eee",

                        fontSize: "14px",
                        fontFamily: "Tahoma, Arial, sans-serif",
                        lineHeight: 1.9,
                        direction: "rtl",
                        outline: "none",
                    }}
                />

                {/* ACTIONS */}

                {hasDirectContact ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(140px, 1fr))",
                            gap: "9px",
                        }}
                    >
                        {whatsappHref ? (
                            <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noreferrer"

                                style={{
                                    display: "block",
                                    padding: "13px 12px",

                                    textAlign: "center",
                                    textDecoration: "none",

                                    border: "1px solid #c9a45c",
                                    borderRadius: "11px",

                                    background:
                                        "linear-gradient(135deg, #c9a45c, #a9823f)",

                                    color: "#fff",
                                    fontSize: "13px",
                                    fontWeight: 900,
                                }}
                            >
                                💬 ارسال درخواست در واتساپ
                            </a>
                        ) : null}

                        {callHref ? (
                            <a
                                href={callHref}

                                style={{
                                    display: "block",
                                    padding: "13px 12px",

                                    textAlign: "center",
                                    textDecoration: "none",

                                    border: "1px solid #333",
                                    borderRadius: "11px",

                                    background: "#fff",
                                    color: "#0a0a0a",
                                    fontSize: "13px",
                                    fontWeight: 900,
                                }}
                            >
                                📞 تماس تلفنی
                            </a>
                        ) : null}

                        {mailHref ? (
                            <a
                                href={mailHref}

                                style={{
                                    display: "block",
                                    padding: "13px 12px",

                                    textAlign: "center",
                                    textDecoration: "none",

                                    border: "1px solid #333",
                                    borderRadius: "11px",

                                    background: "#151515",
                                    color: "#eee",
                                    fontSize: "13px",
                                    fontWeight: 900,
                                }}
                            >
                                ✉️ ارسال ایمیل
                            </a>
                        ) : null}
                    </div>
                ) : (
                    <div
                        style={{
                            padding: "13px",
                            border: "1px solid rgba(212,175,55,0.30)",
                            borderRadius: "12px",
                            background: "rgba(212,175,55,0.06)",
                            color: "#e8d9ac",
                            fontSize: "13px",
                            fontWeight: 700,
                            lineHeight: 1.9,
                        }}
                    >
                        شماره تماس / واتساپ این نمایندگی هنوز در تنظیمات ثبت
                        نشده است. متن درخواست را کپی کنید و برای ما بفرستید.
                    </div>
                )}

                {/* COPY HELPERS */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "9px",
                        marginTop: "9px",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => copy(message, "message")}

                        style={{
                            padding: "11px 12px",

                            border: "1px solid rgba(255,255,255,0.14)",
                            borderRadius: "11px",

                            background: "rgba(255,255,255,0.03)",
                            color: "#ddd",

                            fontSize: "12px",
                            fontWeight: 800,
                            fontFamily: "Tahoma, Arial, sans-serif",

                            cursor: "pointer",
                        }}
                    >
                        {copied === "message" ? "✓ متن کپی شد" : "کپی متن درخواست"}
                    </button>

                    {phone ? (
                        <button
                            type="button"
                            onClick={() => copy(phone, "phone")}

                            style={{
                                padding: "11px 12px",

                                border: "1px solid rgba(255,255,255,0.14)",
                                borderRadius: "11px",

                                background: "rgba(255,255,255,0.03)",
                                color: "#ddd",

                                fontSize: "12px",
                                fontWeight: 800,
                                fontFamily: "Tahoma, Arial, sans-serif",

                                cursor: "pointer",
                            }}
                        >
                            {copied === "phone"
                                ? "✓ شماره کپی شد"
                                : "کپی شماره تماس"}
                        </button>
                    ) : null}
                </div>

                {phone ? (
                    <div
                        style={{
                            marginTop: "14px",
                            color: "#8a8a8a",
                            fontSize: "12px",
                            fontWeight: 700,
                            textAlign: "center",
                        }}
                    >
                        شماره تماس: <span dir="ltr">{phone}</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default ContactModal;
