import React, { useEffect, useMemo, useState } from "react";
import { getImageUrl } from "../utils/imageUrl";
import dealerConfig from "../config/dealerConfig";
import ContactModal from "../components/ContactModal";

const PLACEHOLDER_IMAGE =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";

// ------------------------------------------------------------
// پالت لوکس: مشکی عمیق + طلایی شامپاینی
// ------------------------------------------------------------
const GOLD = "#d4af37";
const GOLD_TEXT = "#e9d28c";
const GOLD_DIM = "rgba(212,175,55,0.55)";
const GOLD_FAINT = "rgba(212,175,55,0.16)";

const headingFont = (isFa) =>
    isFa
        ? "'Markazi Text', Tahoma, serif"
        : "'Playfair Display', 'Cormorant Garamond', Georgia, serif";

const bodyFont = (isFa) =>
    isFa
        ? "'Vazirmatn', Tahoma, sans-serif"
        : "'Montserrat', 'Helvetica Neue', Arial, sans-serif";

// کادر مشترک همه‌ی بخش‌ها (شیشه‌ای با لبه‌ی طلایی)
const cardStyle = {
    position: "relative",
    background:
        "linear-gradient(165deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.014) 45%, rgba(212,175,55,0.07) 100%)",
    border: `1px solid ${GOLD_FAINT}`,
    borderRadius: "24px",
    boxShadow:
        "0 26px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
};

// قاب طلایی دور تصویر اصلی خودرو
const goldFrame = {
    padding: "3px",
    borderRadius: "27px",
    background:
        "linear-gradient(135deg, rgba(212,175,55,0.75) 0%, rgba(212,175,55,0.12) 40%, rgba(212,175,55,0.5) 100%)",
    boxShadow:
        "0 34px 90px rgba(0,0,0,0.55), 0 0 70px rgba(212,175,55,0.09)",
    marginBottom: "16px",
};

function SectionTitle({ label, isFa }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: GOLD_TEXT,
                fontSize: isFa ? "20px" : "13px",
                fontWeight: 700,
                letterSpacing: isFa ? "0" : "3px",
                marginBottom: "20px",
                fontFamily: bodyFont(isFa),
            }}
        >
            <span
                style={{
                    width: "28px",
                    height: "2px",
                    borderRadius: "2px",
                    background: `linear-gradient(90deg, ${GOLD}, transparent)`,
                }}
            />
            {label}
        </div>
    );
}

// onEdit و onManageImages اختیاری هستند: فقط وقتی پنل ادمین این صفحه را
// باز می‌کند مقدار دارند و یک نوار عملیات ادمین بالای صفحه ظاهر می‌شود.
// در سایت (Home) مقدار ندارند و هیچ دکمه‌ی ادمینی رندر نمی‌شود.
function CarDetails({ car, onBack, onEdit, onManageImages }) {
    const [language, setLanguage] = useState("fa");
    const [contactOpen, setContactOpen] = useState(false);

    const isFa = language === "fa";

    const labels = isFa
        ? {
              back: "← بازگشت به خودروها",
              premium: "خودروی ویژه",
              year: "سال",
              gallery: "گالری خودرو",
              front: "جلو",
              side: "بغل",
              rear: "عقب",
              interior: "داخل کابین",
              price: "قیمت",
              priceNote: "قیمت با احتساب هزینه حمل با لندیکرافت از مبدا می باشد",
              requestVisit: "درخواست بازدید / تماس",
              whatsapp: "درخواست در واتساپ",
              location: "موقعیت",
              origin: "کشور مبدأ",
              dealer: "نمایندگی / فروشنده",
              status: "وضعیت",
              brand: "برند",
              model: "مدل",
              shipping: "هزینه حمل",
              customs: "هزینه گمرک",
              customsBuyer: "بعهده خریدار",
              description: "توضیحات",
              information: "اطلاعات خودرو",
              vehicleId: "شناسه خودرو",
              photoCategories: "دسته‌بندی تصاویر",
              noImage: "تصویری موجود نیست",
              active: "فعال",
              imageAvailable: "تصویر موجود است",
              editDetails: "ویرایش مشخصات",
              manageImages: "مدیریت تصاویر",

              english: "English",
              persian: "فارسی",
          }
        : {
              back: "← BACK TO VEHICLES",
              premium: "PREMIUM VEHICLE",
              year: "YEAR",
              gallery: "VEHICLE GALLERY",
              front: "FRONT",
              side: "SIDE",
              rear: "REAR",
              interior: "INTERIOR",
              price: "PRICE",
              priceNote: "Price includes shipping with Land Cruiser from origin.",
              requestVisit: "REQUEST A VISIT",
              whatsapp: "WHATSAPP REQUEST",
              location: "LOCATION",
              origin: "ORIGIN COUNTRY",
              dealer: "DEALER",
              status: "STATUS",
              brand: "BRAND",
              model: "MODEL",
              shipping: "SHIPPING COST",
              customs: "CUSTOMS COST",
              customsBuyer: "Buyer responsibility",
              description: "DESCRIPTION",
              information: "VEHICLE INFORMATION",
              vehicleId: "VEHICLE ID",
              photoCategories: "PHOTO CATEGORIES",
              noImage: "NO IMAGE",
              active: "ACTIVE",
              imageAvailable: "IMAGE AVAILABLE",
              editDetails: "EDIT DETAILS",
              manageImages: "MANAGE IMAGES",

              english: "English",
              persian: "فارسی",
          };

    const images = Array.isArray(car?.images) ? car.images : [];

    const gallery = useMemo(
        () => {
            const sortedImages = images
                .filter((img) => {
                    const imageUrl = String(img?.image_url || "").trim();
                    return imageUrl.length > 0;
                })
                .sort((a, b) => {
                    const aPrimary =
                        String(a?.id) === String(car?.primary_image_id);
                    const bPrimary =
                        String(b?.id) === String(car?.primary_image_id);

                    if (aPrimary && !bPrimary) return -1;
                    if (!aPrimary && bPrimary) return 1;

                    return (
                        Number(a?.sort_order || 0) -
                        Number(b?.sort_order || 0)
                    );
                });

            return sortedImages.map((img) => {
                const viewType =
                    String(img?.view_type || "").toUpperCase();

                let label;

                if (viewType === "INTERIOR") {
                    label = labels.interior;
                } else if (
                    String(img?.id) === String(car?.primary_image_id)
                ) {
                    label = isFa ? "تصویر اصلی" : "MAIN IMAGE";
                } else if (viewType === "FRONT") {
                    label = labels.front;
                } else if (viewType === "SIDE") {
                    label = labels.side;
                } else if (viewType === "REAR") {
                    label = labels.rear;
                } else {
                    label = isFa ? "تصویر" : "IMAGE";
                }

                return {
                    key: String(img.id),
                    label,
                    image: getImageUrl(img.image_url),
                };
            });
        },
        [
            images,
            car?.primary_image_id,
            isFa,
            labels.front,
            labels.side,
            labels.rear,
            labels.interior,
        ]
    );

    const primaryImage = images.find(
        (img) =>
            String(img?.id) === String(car?.primary_image_id) &&
            img?.image_url
    )?.image_url;

    const firstImage =
        (primaryImage && getImageUrl(primaryImage)) ||
        gallery.find((item) => item.image)?.image ||
        PLACEHOLDER_IMAGE;

    const [activeImage, setActiveImage] = useState(firstImage);

    // اگر خودرو عوض شود ولی کامپوننت remount نشود، تصویر بزرگ نباید روی
    // عکس خودروی قبلی بماند.
    useEffect(() => {
        setActiveImage(firstImage);
    }, [car?.id, firstImage]);

    const brand = car?.brand_name || car?.brand || "-";
    const model = car?.model_name || car?.model || "-";
    const year = car?.year || "-";

    const price = car?.price_aed
        ? Number(car.price_aed).toLocaleString("en-US")
        : "N/A";

    const shippingCost = car?.shipping_cost
        ? Number(car.shipping_cost).toLocaleString("en-US")
        : "0";

    const description =
        car?.description ||
        (isFa
            ? "توضیحاتی برای این خودرو ثبت نشده است."
            : "No description available for this vehicle.");

    const status =
        String(car?.status || "").toUpperCase() === "ACTIVE"
            ? labels.active
            : car?.status || "-";

    const carCity = String(car?.city || "").trim();
    const carCountry = String(car?.country || "").trim();

    const locationValue =
        carCity ||
        (isFa ? dealerConfig.cityFa : dealerConfig.cityEn) ||
        dealerConfig.city ||
        "-";

    const originValue =
        carCountry ||
        (isFa ? dealerConfig.countryFa : dealerConfig.countryEn) ||
        dealerConfig.country ||
        "-";

    const whatsappNumber = String(dealerConfig.whatsapp || "").replace(
        /[^\d]/g,
        ""
    );

    const whatsappMessage = `سلام، برای خودروی ${brand} ${model}${
        car?.year ? ` مدل ${car.year}` : ""
    }${car?.id ? ` (کد ${car.id})` : ""} درخواست بازدید / تماس دارم.`;

    const whatsappHref = whatsappNumber
        ? `${"ht" + "ps://wa.me"}/${whatsappNumber}?text=${encodeURIComponent(
              whatsappMessage
          )}`
        : "";

    const direction = isFa ? "rtl" : "ltr";

    return (
        <>
            {/* فونت‌های لوکس از Google Fonts */}
            <link rel="preconnect" href={"ht" + "tps://fonts.googleapis.com"} />
            <link
                rel="preconnect"
                href={"ht" + "tps://fonts.gstatic.com"}
                crossOrigin="anonymous"
            />
            <link
                href={
                    ("ht" + "tps://fonts.googleapis.com/css2?") +
                    "family=Cormorant+Garamond:wght@500;600;700&" +
                    "family=Markazi+Text:wght@400;500;600;700&" +
                    "family=Montserrat:wght@300;400;500;600;700&" +
                    "family=Playfair+Display:wght@600;700;800&" +
                    "family=Vazirmatn:wght@300;400;500;700&" +
                    "display=swap"
                }
                rel="stylesheet"
            />

            {/* چیدمان ریسپانسیو */}
            <style>{`
                .lux-info-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
                    gap: 24px;
                    align-items: start;
                }
                .lux-info-items {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 20px;
                }
                .lux-gold-text {
                    background: linear-gradient(120deg, #f9e9a0 0%, #d4af37 45%, #a97f2f 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                @media (max-width: 1020px) {
                    .lux-info-grid { grid-template-columns: 1fr; }
                }
                @media (max-width: 620px) {
                    .lux-info-items { grid-template-columns: 1fr; }
                    .lux-title-row { row-gap: 10px; }
                }
            `}</style>

            <div
                dir={direction}
                style={{
                    minHeight: "100vh",
                    background:
                        "radial-gradient(1100px 520px at 50% -8%, rgba(212,175,55,0.10), transparent 62%), linear-gradient(180deg, #060606 0%, #0a0a0a 100%)",
                    color: "#fff",
                    fontFamily: bodyFont(isFa),
                    padding: "26px",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
                    {/* TOP BAR */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "16px",
                            marginBottom: "26px",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                if (onBack) {
                                    onBack();
                                } else {
                                    window.history.back();
                                }
                            }}
                            style={{
                                padding: "13px 22px",
                                border: "1px solid rgba(255,255,255,0.28)",
                                borderRadius: "12px",
                                background:
                                    "linear-gradient(180deg, #faf5e8 0%, #ece0c4 100%)",
                                color: "#171104",
                                cursor: "pointer",
                                fontSize: isFa ? "15px" : "12px",
                                fontWeight: 800,
                                letterSpacing: isFa ? "0" : "1px",
                                fontFamily: bodyFont(isFa),
                                boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
                            }}
                        >
                            {labels.back}
                        </button>

                        {(onEdit || onManageImages) ? (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                    marginInlineStart: "auto",
                                }}
                            >
                                {onEdit ? (
                                    <button
                                        type="button"
                                        onClick={onEdit}
                                        style={{
                                            padding: "13px 18px",
                                            border: `1px solid ${GOLD_DIM}`,
                                            borderRadius: "12px",
                                            background: "transparent",
                                            color: GOLD_TEXT,
                                            cursor: "pointer",
                                            fontSize: isFa ? "14px" : "12px",
                                            fontWeight: 800,
                                            letterSpacing: isFa ? "0" : "1px",
                                            fontFamily: bodyFont(isFa),
                                        }}
                                    >
                                        {labels.editDetails}
                                    </button>
                                ) : null}

                                {onManageImages ? (
                                    <button
                                        type="button"
                                        onClick={onManageImages}
                                        style={{
                                            padding: "13px 18px",
                                            border: "1px solid rgba(255,255,255,0.28)",
                                            borderRadius: "12px",
                                            background:
                                                "linear-gradient(180deg, #faf5e8 0%, #ece0c4 100%)",
                                            color: "#171104",
                                            cursor: "pointer",
                                            fontSize: isFa ? "14px" : "12px",
                                            fontWeight: 800,
                                            letterSpacing: isFa ? "0" : "1px",
                                            fontFamily: bodyFont(isFa),
                                        }}
                                    >
                                        {labels.manageImages}
                                    </button>
                                ) : null}
                            </div>
                        ) : null}

                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                padding: "4px",
                                background: "rgba(255,255,255,0.045)",
                                border: `1px solid ${GOLD_FAINT}`,
                                borderRadius: "12px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setLanguage("fa")}
                                style={{
                                    border: "none",
                                    borderRadius: "9px",
                                    padding: "9px 14px",
                                    cursor: "pointer",
                                    background:
                                        language === "fa" ? GOLD : "transparent",
                                    color:
                                        language === "fa" ? "#171104" : "#aaa",
                                    fontWeight: 800,
                                    fontSize: "12px",
                                    fontFamily: bodyFont(isFa),
                                }}
                            >
                                {labels.persian}
                            </button>

                            <button
                                type="button"
                                onClick={() => setLanguage("en")}
                                style={{
                                    border: "none",
                                    borderRadius: "9px",
                                    padding: "9px 14px",
                                    cursor: "pointer",
                                    background:
                                        language === "en" ? GOLD : "transparent",
                                    color:
                                        language === "en" ? "#171104" : "#aaa",
                                    fontWeight: 800,
                                    fontSize: "12px",
                                    fontFamily: bodyFont(isFa),
                                }}
                            >
                                {labels.english}
                            </button>
                        </div>
                    </div>

                    {/* HEADER — برند و مدل لوکس */}

                    <section
                        style={{
                            position: "relative",
                            overflow: "hidden",
                            background:
                                "linear-gradient(135deg, #16130c 0%, #0b0906 55%, #151006 100%)",
                            border: "1px solid rgba(212,175,55,0.22)",
                            borderRadius: "28px",
                            padding: "38px 36px",
                            marginBottom: "24px",
                            boxShadow:
                                "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: -120,
                                insetInlineStart: -80,
                                width: 340,
                                height: 340,
                                background:
                                    "radial-gradient(circle, rgba(212,175,55,0.16), transparent 65%)",
                                pointerEvents: "none",
                            }}
                        />

                        <div
                            style={{
                                position: "absolute",
                                bottom: -140,
                                insetInlineEnd: -60,
                                width: 380,
                                height: 380,
                                background:
                                    "radial-gradient(circle, rgba(212,175,55,0.10), transparent 65%)",
                                pointerEvents: "none",
                            }}
                        />

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                color: GOLD_DIM,
                                fontSize: isFa ? "15px" : "11px",
                                fontWeight: 800,
                                letterSpacing: isFa ? "0" : "3px",
                                marginBottom: "16px",
                                position: "relative",
                            }}
                        >
                            <span
                                style={{
                                    width: "36px",
                                    height: "1.5px",
                                    background: `linear-gradient(90deg, ${GOLD}, transparent)`,
                                }}
                            />
                            {labels.premium}
                            <span
                                style={{
                                    flex: 1,
                                    height: "1.5px",
                                    background:
                                        "linear-gradient(90deg, rgba(212,175,55,0.5), transparent)",
                                }}
                            />
                        </div>

                        <div
                            className="lux-title-row"
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: "14px",
                                flexWrap: "wrap",
                                position: "relative",
                            }}
                        >
                            <h1
                                className="lux-gold-text"
                                style={{
                                    margin: 0,
                                    fontSize: isFa
                                        ? "clamp(26px, 6.5vw, 46px)"
                                        : "clamp(30px, 6vw, 52px)",
                                    lineHeight: 1.1,
                                    fontWeight: 800,
                                    fontFamily: headingFont(isFa),
                                    minWidth: 0,
                                    overflowWrap: "break-word",
                                }}
                            >
                                {brand}
                            </h1>

                            <span
                                style={{
                                    color: GOLD_DIM,
                                    fontSize: "clamp(22px, 4vw, 34px)",
                                    fontWeight: 300,
                                    lineHeight: 1,
                                }}
                            >
                                /
                            </span>

                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: isFa
                                        ? "clamp(24px, 6vw, 40px)"
                                        : "clamp(26px, 5.5vw, 46px)",
                                    lineHeight: 1.1,
                                    fontWeight: 700,
                                    fontFamily: headingFont(isFa),
                                    color: "#f5ead2",
                                    minWidth: 0,
                                    overflowWrap: "break-word",
                                }}
                            >
                                {model}
                            </h2>

                            <div
                                style={{
                                    marginInlineStart: "auto",
                                    padding: "12px 20px",
                                    borderRadius: "12px",
                                    background:
                                        "linear-gradient(135deg, #eed77f 0%, #c9a227 100%)",
                                    color: "#171104",
                                    fontSize: isFa ? "16px" : "15px",
                                    fontWeight: 800,
                                    letterSpacing: "1px",
                                    boxShadow:
                                        "0 10px 26px rgba(212,175,55,0.30)",
                                    fontFamily: bodyFont(isFa),
                                }}
                            >
                                {year}
                            </div>
                        </div>
                    </section>

                    {/* GALLERY — قاب طلایی لوکس */}

                    <section style={{ ...cardStyle, padding: "26px", marginBottom: "24px" }}>
                        <SectionTitle label={labels.gallery} isFa={isFa} />

                        <div style={goldFrame}>
                            <div
                                style={{
                                    borderRadius: "24px",
                                    overflow: "hidden",
                                    background:
                                        "radial-gradient(ellipse at 50% 30%, #18150e 0%, #070707 70%)",
                                    height: "clamp(300px, 56vw, 520px)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    boxSizing: "border-box",
                                    padding: "22px",
                                }}
                            >
                                <img
                                    src={activeImage}
                                    alt={`${brand} ${model}`}
                                    onError={(e) => {
                                        if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
                                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                                        }
                                    }}
                                    style={{
                                        // بدون بزرگ‌نمایی: عکس فقط تا اندازه‌ی طبیعی خودش
                                        // نمایش داده می‌شود؛ اگر از قاب بزرگ‌تر بود
                                        // کوچک می‌شود. نتیجه: هرگز کشیده یا تار نمی‌شود.
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        width: "auto",
                                        height: "auto",
                                        objectFit: "contain",
                                        display: "block",
                                        borderRadius: "10px",
                                        boxShadow:
                                            "0 18px 50px rgba(0,0,0,0.55)",
                                    }}
                                />

                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        pointerEvents: "none",
                                        background:
                                            "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.42) 100%)",
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(130px, 1fr))",
                                gap: "10px",
                                width: "100%",
                            }}
                        >
                            {gallery.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => {
                                        if (item.image) {
                                            setActiveImage(item.image);
                                        }
                                    }}
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        aspectRatio: "16 / 10",
                                        border:
                                            activeImage === item.image
                                                ? `2px solid ${GOLD}`
                                                : "1px solid rgba(255,255,255,0.10)",
                                        borderRadius: "14px",
                                        overflow: "hidden",
                                        padding: 0,
                                        background: "#12100c",
                                        cursor: item.image ? "pointer" : "default",
                                        boxShadow:
                                            activeImage === item.image
                                                ? "0 10px 28px rgba(212,175,55,0.28)"
                                                : "none",
                                        transition:
                                            "transform 0.25s ease, box-shadow 0.25s ease",
                                    }}
                                >
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.label}
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                            }}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    ) : null}

                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            padding: "8px",
                                            background:
                                                "linear-gradient(transparent, rgba(0,0,0,.85))",
                                            color: "#f0e6c8",
                                            fontSize: isFa ? "13px" : "11px",
                                            fontWeight: 700,
                                            fontFamily: bodyFont(isFa),
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* INFORMATION */}

                    <section className="lux-info-grid">
                        <div style={{ ...cardStyle, padding: "28px" }}>
                            {/* PRICE */}

                            <div
                                style={{
                                    paddingBottom: "24px",
                                    marginBottom: "24px",
                                    borderBottom: "1px solid rgba(212,175,55,0.15)",
                                }}
                            >
                                <div
                                    style={{
                                        color: GOLD_DIM,
                                        fontSize: isFa ? "14px" : "10px",
                                        fontWeight: 800,
                                        letterSpacing: isFa ? "0" : "2.5px",
                                        marginBottom: "8px",
                                        fontFamily: bodyFont(isFa),
                                    }}
                                >
                                    {labels.price}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: isFa ? "46px" : "44px",
                                            fontWeight: 800,
                                            fontFamily: headingFont(isFa),
                                            color: "#f7ecd2",
                                            lineHeight: 1,
                                        }}
                                    >
                                        {price}
                                    </span>

                                    <span
                                        style={{
                                            fontSize: isFa ? "16px" : "13px",
                                            fontWeight: 700,
                                            color: GOLD_TEXT,
                                            letterSpacing: "1px",
                                        }}
                                    >
                                        {dealerConfig.currency}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        marginTop: "10px",
                                        color: "#9b8f76",
                                        fontSize: isFa ? "13px" : "11px",
                                        fontWeight: 500,
                                        lineHeight: 1.9,
                                    }}
                                >
                                    {labels.priceNote}
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fit, minmax(160px, 1fr))",
                                        gap: "12px",
                                        marginTop: "20px",
                                    }}
                                >
                                    <a
                                        href={whatsappHref || undefined}
                                        target={whatsappHref ? "_blank" : undefined}
                                        rel={whatsappHref ? "noreferrer" : undefined}
                                        onClick={(event) => {
                                            if (!whatsappHref) {
                                                event.preventDefault();
                                                setContactOpen(true);
                                            }
                                        }}
                                        style={{
                                            display: "block",
                                            padding: "15px 12px",
                                            textAlign: "center",
                                            textDecoration: "none",
                                            border: "1px solid rgba(212,175,55,0.75)",
                                            borderRadius: "12px",
                                            background:
                                                "linear-gradient(135deg, #eed77f 0%, #c9a227 55%, #a97f2f 100%)",
                                            color: "#171104",
                                            fontSize: isFa ? "15px" : "12px",
                                            fontWeight: 800,
                                            letterSpacing: isFa ? "0" : "1px",
                                            cursor: "pointer",
                                            fontFamily: bodyFont(isFa),
                                            boxShadow:
                                                "0 14px 30px rgba(212,175,55,0.22), inset 0 1px 0 rgba(255,255,255,0.55)",
                                        }}
                                    >
                                        {labels.whatsapp}
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => setContactOpen(true)}
                                        style={{
                                            padding: "15px 12px",
                                            border: "1px solid rgba(255,255,255,0.22)",
                                            borderRadius: "12px",
                                            background:
                                                "linear-gradient(180deg, #faf5e8 0%, #ece0c4 100%)",
                                            color: "#171104",
                                            fontSize: isFa ? "15px" : "12px",
                                            fontWeight: 800,
                                            letterSpacing: isFa ? "0" : "1px",
                                            fontFamily: bodyFont(isFa),
                                            cursor: "pointer",
                                            boxShadow: "0 12px 26px rgba(0,0,0,0.30)",
                                        }}
                                    >
                                        {labels.requestVisit}
                                    </button>
                                </div>
                            </div>

                            {/* BASIC INFO */}

                            <div className="lux-info-items">
                                <Info label={labels.location} value={locationValue} isFa={isFa} />
                                <Info label={labels.origin} value={originValue} isFa={isFa} />
                                <Info label={labels.dealer} value={dealerConfig.name} isFa={isFa} />
                                <Info label={labels.status} value={status} isFa={isFa} />
                                <Info label={labels.year} value={year} isFa={isFa} />
                                <Info label={labels.brand} value={brand} isFa={isFa} />
                                <Info label={labels.model} value={model} isFa={isFa} />
                                <Info label={labels.vehicleId} value={car?.id ?? "-"} isFa={isFa} />
                            </div>

                            {/* DESCRIPTION */}

                            <div
                                style={{
                                    marginTop: "26px",
                                    paddingTop: "24px",
                                    borderTop: "1px solid rgba(212,175,55,0.15)",
                                }}
                            >
                                <div
                                    style={{
                                        color: GOLD_DIM,
                                        fontSize: isFa ? "14px" : "10px",
                                        fontWeight: 800,
                                        letterSpacing: isFa ? "0" : "2.5px",
                                        marginBottom: "12px",
                                        fontFamily: bodyFont(isFa),
                                    }}
                                >
                                    {labels.description}
                                </div>

                                <div
                                    style={{
                                        color: "#e6dcc3",
                                        fontSize: isFa ? "19px" : "15px",
                                        lineHeight: 2,
                                        fontWeight: isFa ? 500 : 400,
                                        fontFamily: headingFont(isFa),
                                    }}
                                >
                                    {description}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT INFORMATION */}

                        <aside style={{ ...cardStyle, padding: "28px" }}>
                            <SectionTitle label={labels.information} isFa={isFa} />

                            <DetailRow label={labels.brand} value={brand} isFa={isFa} />
                            <DetailRow label={labels.model} value={model} isFa={isFa} />
                            <DetailRow label={labels.year} value={year} isFa={isFa} />
                            <DetailRow label={labels.location} value={locationValue} isFa={isFa} />
                            <DetailRow label={labels.origin} value={originValue} isFa={isFa} />
                            <DetailRow label={labels.dealer} value={dealerConfig.name} isFa={isFa} />
                            <DetailRow label={labels.status} value={status} isFa={isFa} />
                            <DetailRow
                                label={labels.price}
                                value={`${price} ${dealerConfig.currency}`}
                                isFa={isFa}
                            />
                            <DetailRow label={labels.vehicleId} value={car?.id ?? "-"} isFa={isFa} />
                            <DetailRow
                                label={labels.shipping}
                                value={`${shippingCost} ${dealerConfig.currency}`}
                                isFa={isFa}
                            />
                            <DetailRow label={labels.customs} value={labels.customsBuyer} isFa={isFa} />
                        </aside>
                    </section>

                    {/* PHOTO CATEGORIES */}

                    <section style={{ ...cardStyle, padding: "28px", marginTop: "24px" }}>
                        <SectionTitle label={labels.photoCategories} isFa={isFa} />

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                                gap: "12px",
                            }}
                        >
                            {gallery.map((item) => (
                                <div
                                    key={`category-${item.key}`}
                                    style={{
                                        padding: "18px",
                                        border: `1px solid ${GOLD_FAINT}`,
                                        borderRadius: "14px",
                                        background: "rgba(0,0,0,0.32)",
                                    }}
                                >
                                    <div
                                        style={{
                                            color: GOLD_TEXT,
                                            fontSize: isFa ? "17px" : "12px",
                                            fontWeight: 700,
                                            fontFamily: headingFont(isFa),
                                            marginBottom: "10px",
                                        }}
                                    >
                                        {item.label}
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: item.image ? "#d9cfae" : "#6b6452",
                                            fontSize: isFa ? "13px" : "11px",
                                            fontFamily: bodyFont(isFa),
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "7px",
                                                height: "7px",
                                                borderRadius: "50%",
                                                background: item.image ? GOLD : "#4a4536",
                                            }}
                                        />
                                        {item.image ? labels.imageAvailable : labels.noImage}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* VISIT / CONTACT MODAL */}

                {contactOpen ? (
                    <ContactModal car={car} onClose={() => setContactOpen(false)} />
                ) : null}
            </div>
        </>
    );
}

function Info({ label, value, isFa }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div
                style={{
                    color: GOLD_DIM,
                    fontSize: isFa ? "12px" : "10px",
                    fontWeight: 800,
                    letterSpacing: isFa ? "0" : "1.6px",
                    marginBottom: "8px",
                    fontFamily: bodyFont(isFa),
                }}
            >
                {label}
            </div>

            <div
                style={{
                    color: "#f3ead6",
                    fontSize: isFa ? "20px" : "16px",
                    fontWeight: isFa ? 600 : 500,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                    fontFamily: headingFont(isFa),
                }}
            >
                {value}
            </div>
        </div>
    );
}

function DetailRow({ label, value, isFa }) {
    return (
        <div
            style={{
                padding: "14px 0",
                borderBottom: "1px solid rgba(212,175,55,0.10)",
            }}
        >
            <div
                style={{
                    color: GOLD_DIM,
                    fontSize: isFa ? "12px" : "10px",
                    fontWeight: 800,
                    letterSpacing: isFa ? "0" : "1.4px",
                    marginBottom: "6px",
                    fontFamily: bodyFont(isFa),
                }}
            >
                {label}
            </div>

            <div
                style={{
                    color: "#f1e7cf",
                    fontSize: isFa ? "18px" : "15px",
                    fontWeight: isFa ? 600 : 500,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                    fontFamily: headingFont(isFa),
                }}
            >
                {value}
            </div>
        </div>
    );
}

export default CarDetails;
