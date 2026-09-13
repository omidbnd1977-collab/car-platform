import React, { useState } from "react";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";
import ContactModal from "./ContactModal";

// ------------------------------------------------------------
// کارت خودرو در صفحه‌ی هوم
// ------------------------------------------------------------
// طبق تصمیم کارفرما، کارت فقط «اطلاعات تصمیم‌ساز» را نشان می‌دهد:
//   ۱) عکس خودرو
//   ۲) برند + مدل (برای این‌که معلوم باشد کدام خودرو است)
//   ۳) مبلغ
//   ۴) دکمه‌ی مشاهده‌ی جزئیات
//   ۵) دکمه‌ی درخواست بازدید / تماس
//
// بقیه‌ی اطلاعات (موقعیت، نمایندگی، وضعیت، هزینه حمل، گمرک، شرح،
// توضیح «قیمت شامل هزینه لندیکرافت»، گالری و ... همه در صفحه‌ی
// جزئیات خودرو (CarDetails) نمایش داده می‌شوند.
// ------------------------------------------------------------

const PLACEHOLDER_IMAGE =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";

// ------------------------------------------------------------
// انتخاب عکس کارت
// ------------------------------------------------------------
// قبلاً همیشه images[0] استفاده می‌شد، یعنی اولین ردیف جدول
// car_images بر اساس sort_order؛ در نتیجه عکس داخلی یا بغل خودرو
// به‌جای عکس اصلی انتخاب می‌شد. حالا اولویت با عکس اصلی است:
//   ۱) تصویری که is_primary = true دارد
//   ۲) تصویری که id آن با cars.primary_image_id برابر است
//   ۳) اگر هیچ‌کدام نبود، اولین عکس معتبر (رفتار قبلی)
// ------------------------------------------------------------
function isPrimaryFlag(value) {
    return value === true || String(value).toLowerCase() === "true";
}

function getCardImageSource(car) {
    const images = (Array.isArray(car?.images) ? car.images : []).filter(
        (img) => img?.image_url
    );

    if (!images.length) {
        return "";
    }

    const primary =
        images.find((img) => isPrimaryFlag(img.is_primary)) ||
        (car?.primary_image_id != null &&
            images.find(
                (img) => String(img.id) === String(car.primary_image_id)
            )) ||
        images[0];

    return primary?.image_url || "";
}

function cleanText(value) {
    return String(value == null ? "" : value).trim();
}

function CarCard({ car, onViewDetails, onContactRequest }) {
    const [hovered, setHovered] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

    const imageSource = getCardImageSource(car);

    const image = imageSource ? getImageUrl(imageSource) : PLACEHOLDER_IMAGE;

    const brand = cleanText(car?.brand_name || car?.brand);
    const model = cleanText(car?.model_name || car?.model);

    const title = `${brand} ${model}`.trim() || "خودرو";

    const price = car?.price_aed
        ? Number(car.price_aed).toLocaleString("en-US")
        : "N/A";

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(car);
        }
    };

    const handleContactRequest = () => {
        if (onContactRequest) {
            onContactRequest(car);
            return;
        }

        setContactOpen(true);
    };

    return (
        <>
            <div
                style={{
                    width: "100%",
                    minWidth: 0,

                    background:
                        "linear-gradient(145deg, #ffffff 0%, #f7f7f7 100%)",

                    borderRadius: "20px",
                    overflow: "hidden",

                    border: "1px solid rgba(0,0,0,0.06)",

                    boxShadow: hovered
                        ? "0 24px 55px rgba(0,0,0,0.20)"
                        : "0 10px 30px rgba(0,0,0,0.09)",

                    transition:
                        "transform 0.45s cubic-bezier(.22,1,.36,1), box-shadow 0.45s cubic-bezier(.22,1,.36,1)",

                    transform: hovered
                        ? "translateY(-8px)"
                        : "translateY(0)",

                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",

                    animation:
                        "carCardReveal 0.7s cubic-bezier(.22,1,.36,1) both",

                    position: "relative",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* IMAGE */}

                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "215px",
                        background: "#eeeeee",
                        overflow: "hidden",
                    }}
                >
                    <img
                        src={image}
                        alt={title}
                        loading="lazy"

                        onError={(event) => {
                            if (
                                event.currentTarget.src !== PLACEHOLDER_IMAGE
                            ) {
                                event.currentTarget.src = PLACEHOLDER_IMAGE;
                            }
                        }}

                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",

                            transform: hovered ? "scale(1.06)" : "scale(1)",

                            transition:
                                "transform 0.8s cubic-bezier(.22,1,.36,1)",
                        }}
                    />

                    {/* DARK IMAGE GRADIENT */}

                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: "38%",

                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.40), transparent)",

                            pointerEvents: "none",
                        }}
                    />

                    {/* YEAR */}

                    {car?.year && (
                        <div
                            style={{
                                position: "absolute",
                                top: "14px",
                                left: "14px",

                                background: "rgba(0,0,0,0.72)",

                                color: "#fff",

                                padding: "6px 11px",
                                borderRadius: "20px",

                                fontSize: "12px",
                                fontWeight: "700",
                                letterSpacing: "0.5px",

                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",

                                border: "1px solid rgba(255,255,255,0.16)",
                            }}
                        >
                            {car.year}
                        </div>
                    )}
                </div>

                {/* CONTENT — حداقل اطلاعات */}

                <div
                    style={{
                        padding: "18px 18px 20px",

                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                    }}
                >
                    {/* BRAND + MODEL */}

                    <h3
                        title={title}
                        style={{
                            margin: "0 0 12px",

                            fontSize: "19px",
                            lineHeight: 1.35,
                            color: "#111",
                            fontWeight: 800,

                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {title}
                    </h3>

                    {/* PRICE */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "7px",
                            flexWrap: "wrap",

                            marginBottom: "20px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "26px",
                                fontWeight: 900,
                                color: "#111",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            {price}
                        </span>

                        <span
                            style={{
                                fontSize: "13px",
                                fontWeight: 800,
                                color: "#8a8a8a",
                                letterSpacing: "0.5px",
                            }}
                        >
                            {dealerConfig.currency}
                        </span>
                    </div>

                    {/* ACTIONS */}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "9px",

                            marginTop: "auto",
                        }}
                    >
                        {/* VIEW DETAILS */}

                        <button
                            type="button"
                            onClick={handleViewDetails}
                            aria-label={`مشاهده جزئیات ${title}`}

                            style={{
                                width: "100%",

                                padding: "12px 12px",

                                border: "1px solid #111",
                                borderRadius: "10px",

                                background: "#111",
                                color: "#fff",

                                cursor: "pointer",

                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "3px",

                                transition:
                                    "background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
                            }}

                            onMouseEnter={(event) => {
                                event.currentTarget.style.background = "#2a2a2a";
                                event.currentTarget.style.transform =
                                    "translateY(-2px)";
                                event.currentTarget.style.boxShadow =
                                    "0 8px 22px rgba(0,0,0,0.18)";
                            }}

                            onMouseLeave={(event) => {
                                event.currentTarget.style.background = "#111";
                                event.currentTarget.style.transform =
                                    "translateY(0)";
                                event.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "Tahoma, Arial, sans-serif",
                                    fontSize: "13px",
                                    fontWeight: 800,
                                    lineHeight: 1.3,
                                }}
                            >
                                مشاهده جزئیات
                            </span>

                            <span
                                style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    letterSpacing: "1.4px",
                                    color: "rgba(255,255,255,0.65)",
                                }}
                            >
                                VIEW DETAILS
                            </span>
                        </button>

                        {/* CONTACT / VISIT REQUEST */}

                        <button
                            type="button"
                            onClick={handleContactRequest}
                            aria-label={`درخواست بازدید یا تماس برای ${title}`}

                            style={{
                                width: "100%",

                                padding: "12px 12px",

                                border: "1px solid #c9a45c",
                                borderRadius: "10px",

                                background:
                                    "linear-gradient(135deg, #c9a45c, #a9823f)",

                                color: "#fff",

                                cursor: "pointer",

                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "3px",

                                transition:
                                    "transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease",
                            }}

                            onMouseEnter={(event) => {
                                event.currentTarget.style.transform =
                                    "translateY(-2px)";
                                event.currentTarget.style.boxShadow =
                                    "0 9px 25px rgba(169,130,63,0.30)";
                                event.currentTarget.style.filter =
                                    "brightness(1.06)";
                            }}

                            onMouseLeave={(event) => {
                                event.currentTarget.style.transform =
                                    "translateY(0)";
                                event.currentTarget.style.boxShadow = "none";
                                event.currentTarget.style.filter =
                                    "brightness(1)";
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "Tahoma, Arial, sans-serif",
                                    fontSize: "13px",
                                    fontWeight: 800,
                                    lineHeight: 1.3,
                                }}
                            >
                                درخواست بازدید / تماس
                            </span>

                            <span
                                style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    letterSpacing: "1.4px",
                                    color: "rgba(255,255,255,0.75)",
                                }}
                            >
                                REQUEST A VISIT
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {contactOpen && (
                <ContactModal
                    car={car}
                    onClose={() => setContactOpen(false)}
                />
            )}
        </>
    );
}

export default CarCard;
