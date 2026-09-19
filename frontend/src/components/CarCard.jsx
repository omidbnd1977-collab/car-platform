import React from "react";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";
import SafeImage from "./SafeImage";

// placeholder قبلاً یک data URI ثابت انگلیسی («No Image») بود و هر فایلی
// که آن را لازم داشت یک کپی از همان رشته داشت. حالا SafeImage آن را
// می‌سازد (تمیز، با آیکون و متن درست) و کارت فقط آدرس عکس را می‌دهد.

// ------------------------------------------------------------
// انتخاب عکس کارت
// ------------------------------------------------------------
// قبلاً همیشه images[0] استفاده می‌شد، یعنی اولین ردیف
// جدول car_images بر اساس sort_order؛ در نتیجه عکس داخلی یا
// بغل خودرو به‌جای عکس اصلی انتخاب می‌شد.
// حالا اولویت با عکس اصلی است:
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

// استایل مشترک سه دکمه‌ی پایین کارت: قد برابر، فشرده، بدون سرریز.
// یک جا تعریف شده تا هر سه دقیقاً هم‌اندازه بمانند.
function actionButtonStyle(colors) {
    return {
        width: "100%",
        height: "100%",
        minHeight: "32px",
        padding: "8px 4px",
        borderRadius: "8px",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "0.2px",
        lineHeight: 1.5,
        whiteSpace: "normal",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.3s ease, filter 0.3s ease",
        ...colors,
    };
}

function CarCard({
    car,
    onViewDetails,
    onContact,
}) {
    const handleContact = () => {
        if (onContact) {
            onContact(car);
            return;
        }
        const phone = String(dealerConfig.phone || "").trim();
        if (phone) {
            window.location.href = `tel:${phone}`;
            return;
        }
        const whatsapp = String(dealerConfig.whatsapp || "")
            .trim()
            .replace(/[^\d]/g, "");
        if (whatsapp) {
            window.open(`https://wa.me/${whatsapp}`, "_blank", "noopener");
            return;
        }
        alert("درخواست تماس / بازدید شما ثبت خواهد شد.");
    };

    const imageSource = getCardImageSource(car);
    const image = imageSource ? getImageUrl(imageSource) : "";
    const brand = car?.brand_name || car?.brand || "";
    const model = car?.model_name || car?.model || "";
    const price = car?.price_aed ? Number(car.price_aed).toLocaleString("en-US") : "N/A";
    const city = String(car?.city || "").trim();

    return (
        <div
            className="car-card"
            style={{
                width: "100%",
                minWidth: 0,
                height: "100%",
                minHeight: "445px",
                background: "linear-gradient(145deg, #16130c 0%, #0b0906 55%, #151006 100%)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(212,175,55,0.32)",
                boxShadow: "0 12px 35px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                transition: "transform 0.5s cubic-bezier(.22,1,.36,1), box-shadow 0.5s cubic-bezier(.22,1,.36,1), border-color 0.4s ease",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                animation: "carCardReveal 0.7s cubic-bezier(.22,1,.36,1) both",
                position: "relative",
            }}
            onMouseEnter={(event) => {
                event.currentTarget.style.transform = "translateY(-10px) scale(1.015)";
                event.currentTarget.style.borderColor = "rgba(212,175,55,0.65)";
                event.currentTarget.style.boxShadow = "0 28px 65px rgba(0,0,0,0.65), 0 0 0 1px rgba(212,175,55,0.25), 0 0 40px rgba(212,175,55,0.18), inset 0 1px 0 rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.transform = "translateY(0) scale(1)";
                event.currentTarget.style.borderColor = "rgba(212,175,55,0.32)";
                event.currentTarget.style.boxShadow = "0 12px 35px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)";
            }}
        >
            {/* IMAGE - 195px شیک */}
            <div
                className="car-card-media"
                style={{
                    position: "relative",
                    width: "100%",
                    height: "215px",
                    background: "#0a0a0a",
                    overflow: "hidden",
                }}
            >
                <SafeImage
                    src={image}
                    alt={`${brand} ${model}`}
                    variant="light"
                    fit="cover"
                    title="عکس در دسترس نیست"
                    loading="lazy"
                />

                {/* شاین طلایی */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: "linear-gradient(120deg, rgba(212,175,55,0.08) 0%, transparent 35%, transparent 70%, rgba(212,175,55,0.05) 100%)",
                        opacity: 0.8,
                    }}
                />

                {/* گرادیان مشکی پایین */}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "55%",
                        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)",
                        pointerEvents: "none",
                    }}
                />

                {/* YEAR - طلایی شامپاینی */}
                {car?.year && (
                    <div
                        style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            background: "linear-gradient(135deg, #d4af37, #a9823f)",
                            color: "#111",
                            padding: "5px 12px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "900",
                            letterSpacing: "0.8px",
                            boxShadow: "0 4px 12px rgba(212,175,55,0.35)",
                            border: "1px solid rgba(255,255,255,0.25)",
                        }}
                    >
                        {car.year}
                    </div>
                )}

                {/* PREMIUM */}
                <div
                    style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(0,0,0,0.72)",
                        color: "#d4af37",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "8px",
                        fontWeight: "900",
                        letterSpacing: "1.8px",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid rgba(212,175,55,0.28)",
                    }}
                >
                    PREMIUM VEHICLE
                </div>
            </div>

            {/* CONTENT - طلایی شامپاینی و مشکی */}
            <div
                style={{
                    padding: "18px 18px 16px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        color: "#8a7d5e",
                        fontSize: "7px",
                        fontWeight: "900",
                        letterSpacing: "2.2px",
                        marginBottom: "2px",
                        lineHeight: 1,
                        textAlign: "center",
                    }}
                >
                    LUXURY EDITION
                </div>

                <h2
                    style={{
                        margin: "0 0 4px",
                        textAlign: "center",
                        fontSize: "16px",
                        lineHeight: 1.1,
                        color: "#f5e6c8",
                        fontWeight: "800",
                        fontFamily: "'Playfair Display', Tahoma, serif",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "36px",
                    }}
                >
                    {brand} <span style={{ color: "#d4af37" }}>/</span> {model}
                </h2>

                <div
                    style={{
                        marginBottom: "6px",
                        textAlign: "center",
                        padding: "6px 0 8px",
                        borderTop: "1px solid rgba(212,175,55,0.14)",
                        borderBottom: "1px solid rgba(212,175,55,0.10)",
                        background: "radial-gradient(ellipse at center, rgba(212,175,55,0.06), transparent 70%)",
                        lineHeight: 1.1,
                    }}
                >
                    <div
                        style={{
                            fontSize: "7px",
                            color: "#8a7d5e",
                            letterSpacing: "2px",
                            marginBottom: "2px",
                            fontWeight: "800",
                            lineHeight: 1,
                            textAlign: "center",
                        }}
                    >
                        PRICE
                    </div>
                    <div
                        style={{
                            fontSize: "19px",
                            fontWeight: "900",
                            color: "#f5e6a6",
                            letterSpacing: "-0.3px",
                            textShadow: "0 2px 12px rgba(212,175,55,0.35)",
                            lineHeight: 1.1,
                            textAlign: "center",
                        }}
                    >
                        {price} {dealerConfig.currency}
                    </div>
                    <div
                        style={{
                            marginTop: "3px",
                            color: "#6d6655",
                            fontSize: "7px",
                            letterSpacing: "0.3px",
                            lineHeight: 1.2,
                            textAlign: "center",
                        }}
                    >
                        قیمت شامل هزینه لندیکرافت از مبدأ می‌باشد
                    </div>
                </div>

                {/* دو دکمه هم‌قد - 3 تا کارت در هر ردیف حفظ میشه چون گرید هوم 3 تاییه */}
                <div
                    dir="ltr"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginTop: "auto",
                        alignItems: "stretch",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            if (onViewDetails) {
                                onViewDetails(car);
                            }
                        }}
                        style={{
                            width: "100%",
                            height: "38px",
                            borderRadius: "10px",
                            fontSize: "10.5px",
                            fontWeight: "900",
                            letterSpacing: "0.3px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.3s ease",
                            background: "#0a0a0a",
                            color: "#f5e6c8",
                            border: "1px solid rgba(212,175,55,0.32)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#111";
                            e.currentTarget.style.borderColor = "rgba(212,175,55,0.55)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#0a0a0a";
                            e.currentTarget.style.borderColor = "rgba(212,175,55,0.32)";
                        }}
                    >
                        جزئیات خودرو
                    </button>

                    <button
                        type="button"
                        onClick={handleContact}
                        style={{
                            width: "100%",
                            height: "38px",
                            borderRadius: "10px",
                            fontSize: "10.5px",
                            fontWeight: "900",
                            letterSpacing: "0.3px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.3s ease",
                            background: "linear-gradient(135deg, #e8d27a 0%, #d4af37 25%, #c9a45c 50%, #a9823f 100%)",
                            color: "#111",
                            border: "1px solid #d4af37",
                            boxShadow: "0 6px 18px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.4)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.filter = "brightness(1.08)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.filter = "brightness(1)";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        تماس / درخواست بازدید
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CarCard;
