// ------------------------------------------------------------
// صفحه‌ی جزئیات خودرو (بازنویسی)
// ------------------------------------------------------------
// چه چیزی عوض شد و چرا:
//
// ۱) حذف تکرارها — قبلاً «برند، مدل، سال، موقعیت، نمایندگی، وضعیت،
//    قیمت، شناسه» دو بار نشان داده می‌شد: یک بار در ستون چپ
//    (کامپوننت Info) و یک بار در ستون راست (کامپوننت DetailRow).
//    حالا یک ستون اطلاعات هست و هر فیلد فقط یک بار.
//
// ۲) حذف بخش «دسته‌بندی تصاویر» (photoCategories) به درخواست کاربر؛
//    آن بخش فقط همان عکس‌های گالری را به‌شکل متن «تصویر موجود است»
//    تکرار می‌کرد. ردیف بندانگشتیِ گالری هم دوبار عکس نشان نمی‌دهد:
//    یک تصویر بزرگ + یک ردیف بندانگشتی.
//
// ۳) عکس‌ها — از SafeImage استفاده می‌شود. اگر فایلی روی سرور
//    نبود (۴۰۴ به‌خاطر پاک‌شدن دیسک موقتی Render)، گالری خودش
//    می‌پرد روی عکس سالم بعدی و یک پیام کوتاه می‌دهد؛ هیچ‌وقت
//    آیکون شکسته یا کادر خالی دیده نمی‌شود.
//
// ۴) داده‌ی کامل — Home آبجکت لیست خودروها را می‌دهد که
//    brand_name / توضیحات / تلفن و آدرس نمایندگی را ندارد.
//    این صفحه حالا خودش GET /api/cars/:id را می‌زند تا جزئیات
//    واقعی پر شود (بدون آن‌ها صفحه خالی‌تر از چیزی بود که هست).
//
// ۵) هزینه‌ی گمرک — طبق تصمیم کاربر همان «بعهده خریدار» می‌ماند
//    و مبلغ ثبت‌شده در دیتابیس به مجموع اضافه نمی‌شود.
//
// ۶) ظاهر — یک لایه‌ی ثابت (overlay) روی صفحه، هدر جمع‌وجور با
//    قیمت در همان بالا، گالری چسبان، و کیبورد (← → و Esc).
// ------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import { getImageUrl } from "../utils/imageUrl";
import { apiUrl } from "../utils/apiBase";
import dealerConfig from "../config/dealerConfig";
import SafeImage from "../components/SafeImage";
import { makePlaceholder } from "../utils/imagePlaceholder";
import { labelForImage, pickVisibleIndex } from "../utils/gallery";

const STORAGE_KEY = "carDetailsLang";

// برچسب نماها — یک‌جا برای هر دو زبان تا تکرار شرط‌ها حذف شود.
const VIEW_LABELS = {
    fa: {
        MAIN: "تصویر اصلی",
        FRONT: "جلو",
        SIDE: "بغل",
        REAR: "عقب",
        INTERIOR: "داخل کابین",
        OTHER: "تصویر",
    },
    en: {
        MAIN: "MAIN",
        FRONT: "FRONT",
        SIDE: "SIDE",
        REAR: "REAR",
        INTERIOR: "INTERIOR",
        OTHER: "IMAGE",
    },
};

function buildLabels(isFa) {
    if (isFa) {
        return {
            back: "بازگشت",
            premium: "خودروی ویژه",
            gallery: "گالری",
            price: "قیمت",
            costs: "هزینه‌های جانبی",
            shipping: "هزینه حمل",
            customs: "گمرک",
            customsBuyer: "بعهده خریدار",
            specs: "مشخصات",
            year: "سال ساخت",
            brand: "برند",
            model: "مدل",
            status: "وضعیت",
            country: "کشور",
            location: "موقعیت",
            dealer: "نمایندگی",
            vehicleId: "شناسه",
            description: "توضیحات",
            noDescription: "توضیحاتی برای این خودرو ثبت نشده است.",
            contact: "تماس",
            call: "تماس",
            whatsapp: "واتساپ",
            address: "آدرس",
            active: "فعال",
            loading: "در حال دریافت جزئیات…",
            retry: "تلاش دوباره",
            detailFailed: "جزئیات کامل دریافت نشد؛ آنچه از لیست داشتیم نمایش داده می‌شود.",
            imageMissing: "این عکس روی سرور نیست",
            imageSkipped: "عکس باز نشد؛ عکس بعدی نمایش داده شد.",
            allImagesMissing: "عکس‌های این خودرو روی سرور در دسترس نیست.",
            noImage: "این خودرو عکس ندارد.",
            persian: "فارسی",
            english: "English",
            photoOf: (a, b) =>
                `${Number(a).toLocaleString("fa-IR")} از ${Number(b).toLocaleString("fa-IR")}`,
        };
    }

    return {
        back: "BACK",
        premium: "PREMIUM VEHICLE",
        gallery: "GALLERY",
        price: "PRICE",
        costs: "EXTRA COSTS",
        shipping: "SHIPPING",
        customs: "CUSTOMS",
        customsBuyer: "Buyer responsibility",
        specs: "SPECIFICATIONS",
        year: "YEAR",
        brand: "BRAND",
        model: "MODEL",
        status: "STATUS",
        country: "COUNTRY",
        location: "LOCATION",
        dealer: "DEALER",
        vehicleId: "ID",
        description: "DESCRIPTION",
        noDescription: "No description available for this vehicle.",
        contact: "CONTACT",
        call: "CALL",
        whatsapp: "WHATSAPP",
        address: "ADDRESS",
        active: "ACTIVE",
        loading: "Loading details…",
        retry: "Retry",
        detailFailed: "Full details could not be loaded; showing what we have from the list.",
        imageMissing: "This photo is not on the server",
        imageSkipped: "Photo failed to load — showing the next one.",
        allImagesMissing: "Photos of this vehicle are not available on the server.",
        noImage: "This vehicle has no photo.",
        persian: "فارسی",
        english: "English",
        photoOf: (a, b) => `${a} of ${b}`,
    };
}

function readStoredLang() {
    try {
        const stored =
            typeof window !== "undefined" && window.localStorage
                ? window.localStorage.getItem(STORAGE_KEY)
                : "";

        return stored === "en" ? "en" : "fa";
    } catch {
        return "fa";
    }
}

function isPrimaryFlag(value) {
    return value === true || String(value).toLowerCase() === "true";
}

function toNumber(value) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

function money(value) {
    const parsed = toNumber(value);

    return parsed === null ? "-" : parsed.toLocaleString("en-US");
}

function CarDetails({ car, onBack, onContactRequest }) {
    const [language, setLanguage] = useState(readStoredLang);

    const isFa = language === "fa";
    const labels = useMemo(() => buildLabels(isFa), [isFa]);
    const viewLabels = isFa ? VIEW_LABELS.fa : VIEW_LABELS.en;

    const accent = dealerConfig.primaryColor || "#d4af37";
    const fontStack = isFa
        ? "Tahoma, Arial, sans-serif"
        : "Arial, Helvetica, sans-serif";

    const carId = car?.id;

    // ------------------------------------------------------------
    // وضعیت‌ها
    // ------------------------------------------------------------
    // اصل: هرچه را می‌شود از روی داده‌های دیگر «حساب کرد»، state
    // نمی‌گیریم (عکس فعال، پیامِ پرش، وضعیت لود). این‌طور هم
    // رندرِ زنجیره‌ای اضافه نمی‌شود، هم لینتر react-hooks راضی است.

    // جزئیات کامل از سرور (توضیحات، تلفن/آدرس نمایندگی، نام برند و مدل)
    const [detail, setDetail] = useState(null);
    const [fetchFailed, setFetchFailed] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // گالری
    const [selected, setSelected] = useState(0); // آنچه کاربر انتخاب کرده
    const [brokenUrls, setBrokenUrls] = useState(() => []); // عکس‌هایی که ۴۰۴ بودند
    const [lastSkipped, setLastSkipped] = useState(""); // آخرین عکسی که رد شد

    // Home آبجکتِ لیست را می‌دهد و بعد از رسیدنِ پاسخ سرور، جزئیاتِ
    // کامل جای آن را می‌گیرد؛ data همیشه یک آبجکت معتبر است.
    const data = useMemo(() => detail || car || {}, [detail, car]);

    useEffect(() => {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem(STORAGE_KEY, language);
            }
        } catch {
            // دسترسی به localStorage بسته بود؛ زبان فقط برای همین نمایش می‌ماند.
        }
    }, [language]);

    useEffect(() => {
        if (!carId) {
            return undefined;
        }

        const controller =
            typeof AbortController !== "undefined" ? new AbortController() : null;

        // setState فقط داخل then/catch (یعنی بعد از پاسخ شبکه)،
        // نه مستقیم در بدنه‌ی effect.
        fetch(apiUrl(`cars/${carId}`), {
            signal: controller ? controller.signal : undefined,
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                return res.json();
            })
            .then((payload) => {
                const fresh = payload?.car || payload;

                if (fresh && typeof fresh === "object") {
                    setDetail(fresh);
                    setFetchFailed(false);
                } else {
                    setFetchFailed(true);
                }
            })
            .catch((error) => {
                if (error && error.name === "AbortError") {
                    return;
                }

                setFetchFailed(true);
            });

        return () => {
            if (controller) {
                controller.abort();
            }
        };
    }, [carId, reloadKey]);

    // ------------------------------------------------------------
    // فهرست عکس‌ها: اول عکس اصلی، بعد بقیه بر اساس sort_order
    // ------------------------------------------------------------
    const gallery = useMemo(() => {
        const list = Array.isArray(data?.images) ? data.images : [];

        return list
            .filter((img) => String(img?.image_url || "").trim().length > 0)
            .sort((a, b) => {
                const aPrimary =
                    isPrimaryFlag(a?.is_primary) ||
                    String(a?.id) === String(data?.primary_image_id);
                const bPrimary =
                    isPrimaryFlag(b?.is_primary) ||
                    String(b?.id) === String(data?.primary_image_id);

                if (aPrimary && !bPrimary) return -1;
                if (!aPrimary && bPrimary) return 1;

                return Number(a?.sort_order || 0) - Number(b?.sort_order || 0);
            })
            .map((img) => {
                const { label, isPrimary } = labelForImage(img, data, viewLabels);

                return {
                    key: String(img.id ?? img.image_url),
                    src: getImageUrl(img.image_url),
                    label,
                    isPrimary,
                };
            });
    }, [data, viewLabels]);

    // با عوض‌شدن خودرو، انتخاب و فهرست عکس‌های خراب از نو شروع شود.
    // این الگوی «مقایسه با مقدار قبلی در خودِ رندر» همان روشی است که
    // مستندات React برای بازنشانی state پیشنهاد می‌دهد؛ برخلاف
    // useEffect، یک رندرِ اضافه روی دست کاربر نمی‌گذارد.
    const [prevCarId, setPrevCarId] = useState(carId);

    if (prevCarId !== carId) {
        setPrevCarId(carId);
        setSelected(0);
        setBrokenUrls([]);
        setLastSkipped("");
    }

    const brokenSet = useMemo(() => new Set(brokenUrls), [brokenUrls]);

    // ------------------------------------------------------------
    // قلبِ خواسته‌ی کاربر: عکس خراب → پرش خودکار به عکس سالم بعدی
    // ------------------------------------------------------------
    // اگر عکسِ انتخاب‌شده ۴۰۴ باشد، اولین عکس سالمِ بعدی نمایش داده
    // می‌شود (و اگر به آخر رسیدیم، از اول). این یک مقدارِ محاسبه‌شده
    // است، نه state؛ پس نه رندر زنجیره‌ای دارد نه تایمر.
    const {
        index: activeIndex,
        skipped: skippedBroken,
        allBroken,
    } = pickVisibleIndex(gallery, selected, (src) => brokenSet.has(src));

    const active = gallery.length ? gallery[activeIndex] : null;

    // پیام کوتاهِ روی گالری (همیشه از DOM می‌آید، نه از داخل
    // placeholder؛ چون متنِ داخل SVG با بزرگ‌شدن کادر بزرگ می‌شود)
    let notice = "";

    if (gallery.length === 0) {
        notice = labels.noImage;
    } else if (allBroken) {
        notice = labels.allImagesMissing;
    } else if (skippedBroken && lastSkipped) {
        notice = labels.imageSkipped;
    }

    const go = useCallback(
        (step) => {
            if (gallery.length < 2) {
                return;
            }

            setSelected(
                (prev) => (Math.min(prev, gallery.length - 1) + step + gallery.length) % gallery.length
            );
        },
        [gallery.length]
    );

    // SafeImage وقتی فایلی ۴۰۴ شد این‌جا خبر می‌دهد.
    const handleBroken = useCallback((src) => {
        if (!src) {
            return;
        }

        setBrokenUrls((prev) => (prev.includes(src) ? prev : [...prev, src]));
        setLastSkipped(src);
    }, []);

    // کیبورد: ← → برای گالری، Esc برای بازگشت
    useEffect(() => {
        if (typeof window === "undefined") {
            return undefined;
        }

        const onKeyDown = (event) => {
            const target = event.target;
            const tag = target && target.tagName ? target.tagName.toLowerCase() : "";

            if (tag === "input" || tag === "textarea" || tag === "select") {
                return;
            }

            if (event.key === "Escape") {
                if (onBack) {
                    onBack();
                }

                return;
            }

            if (event.key === "ArrowLeft") {
                go(isFa ? 1 : -1);
            } else if (event.key === "ArrowRight") {
                go(isFa ? -1 : 1);
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [go, isFa, onBack]);

    // ------------------------------------------------------------
    // مقدارهای نمایشی
    // ------------------------------------------------------------
    const brand = data?.brand_name || data?.brand || "-";
    const model = data?.model_name || data?.model || "";
    const year = data?.year || "-";

    const statusRaw = String(data?.status || "").toUpperCase();
    const status = statusRaw === "ACTIVE" ? labels.active : data?.status || "-";

    const location = isFa
        ? `${data?.city || dealerConfig.cityFa || dealerConfig.city || "-"}${
              data?.country || dealerConfig.countryFa
                  ? `، ${data.country || dealerConfig.countryFa}`
                  : ""
          }`
        : `${data?.city || dealerConfig.cityEn || dealerConfig.city || "-"}${
              data?.country || dealerConfig.countryEn
                  ? `, ${data.country || dealerConfig.countryEn}`
                  : ""
          }`;

    const dealerName = data?.dealership_name || dealerConfig.name || "-";
    const phone = String(data?.phone || dealerConfig.phone || "").trim();
    const address = String(data?.address || "").trim();
    const whatsappNumber = String(dealerConfig.whatsapp || phone || "").replace(/[^\d]/g, "");

    const description = String(data?.description || "").trim();

    const features = dealerConfig.features || {};

    const specs = [
        { label: labels.year, value: year },
        { label: labels.brand, value: brand },
        { label: labels.model, value: model || "-" },
        { label: labels.status, value: status },
        { label: labels.location, value: location },
        { label: labels.vehicleId, value: data?.id ?? "-" },
    ];

    const galleryEmpty = gallery.length === 0;

    // فقط آیکون؛ متنِ پیام در نوارِ اطلاعِ روی گالری می‌آید.
    const emptyPlaceholder = useMemo(() => makePlaceholder({ variant: "dark" }), []);

    const direction = isFa ? "rtl" : "ltr";

    const cardStyle = {
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "20px",
    };

    return (
        // لایه‌ی ثابت: Home این صفحه را داخل یک div با padding:30px
        // رندر می‌کند؛ با overlay تمام صفحه مالِ جزئیات می‌شود و
        // تکرارِ پس‌زمینه و حاشیه از بین می‌رود.
        <div
            dir={direction}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                background: "linear-gradient(180deg, #050505 0%, #0b0b0b 100%)",
                color: "#fff",
                fontFamily: fontStack,
            }}
        >
            <div
                style={{
                    maxWidth: "1180px",
                    margin: "0 auto",
                    padding: "18px 18px 44px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                }}
            >
                {/* ==================== نوار بالا ==================== */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            if (onBack) {
                                onBack();
                            } else if (typeof window !== "undefined") {
                                window.history.back();
                            }
                        }}
                        style={{
                            padding: "10px 18px",
                            border: "1px solid rgba(255,255,255,0.16)",
                            borderRadius: "10px",
                            background: "#fff",
                            color: "#050505",
                            cursor: "pointer",
                            fontSize: isFa ? "14px" : "12px",
                            fontWeight: 800,
                            fontFamily: fontStack,
                            letterSpacing: isFa ? 0 : "1px",
                        }}
                    >
                        {isFa ? "→ " : "← "}
                        {labels.back}
                    </button>

                    <LangToggle
                        language={language}
                        onChange={setLanguage}
                        accent={accent}
                        labels={labels}
                    />
                </div>

                {/* ==================== هدر جمع‌وجور ==================== */}

                <section
                    style={{
                        ...cardStyle,
                        background: "linear-gradient(135deg, #121212 0%, #080808 100%)",
                        border: `1px solid ${hexToRgba(accent, 0.22)}`,
                        padding: "22px",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: "18px",
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                        <div
                            style={{
                                color: accent,
                                fontSize: isFa ? "12px" : "10px",
                                fontWeight: 900,
                                letterSpacing: isFa ? 0 : "2px",
                                marginBottom: "8px",
                            }}
                        >
                            {labels.premium}
                        </div>

                        <h1
                            style={{
                                margin: 0,
                                // index.css روی همه‌ی h1ها رنگ تیره‌ی قالب
                                // پیش‌فرض را می‌گذارد؛ این‌جا پوسته تیره است
                                // پس رنگ روشن را صریح می‌دهیم.
                                color: "#fff",
                                fontSize: isFa ? "27px" : "30px",
                                lineHeight: 1.2,
                                fontWeight: 900,
                                wordBreak: "break-word",
                            }}
                        >
                            {brand}
                            {model ? ` ${model}` : ""}
                        </h1>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginTop: "12px",
                            }}
                        >
                            <Chip text={String(year)} accent={accent} strong />
                            <Chip text={status} />
                            <Chip text={location} />
                        </div>
                    </div>

                    <div
                        dir="ltr"
                        style={{
                            textAlign: direction === "rtl" ? "left" : "right",
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                color: "#777",
                                fontSize: isFa ? "12px" : "10px",
                                fontWeight: 800,
                                letterSpacing: isFa ? 0 : "1.6px",
                                marginBottom: "6px",
                            }}
                        >
                            {labels.price}
                        </div>

                        <div
                            style={{
                                fontSize: isFa ? "28px" : "30px",
                                fontWeight: 900,
                                color: accent,
                                lineHeight: 1.1,
                            }}
                        >
                            {money(data?.price_aed)}
                            <span
                                style={{
                                    fontSize: "13px",
                                    color: "#999",
                                    marginInlineStart: "6px",
                                    fontWeight: 800,
                                }}
                            >
                                {dealerConfig.currency}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ==================== بدنه: گالری + اطلاعات ==================== */}

                <div
                    className="cd-grid"
                    style={{
                        display: "grid",
                        gap: "18px",
                        alignItems: "start",
                        // تعداد ستون‌ها در App.css است تا در موبایل
                        // با media query به یک ستون تبدیل شود.
                    }}
                >
                    {/* ---------- گالری ---------- */}

                    <section style={cardStyle}>
                        <SectionHead
                            text={labels.gallery}
                            isFa={isFa}
                            right={
                                gallery.length > 1
                                    ? labels.photoOf(activeIndex + 1, gallery.length)
                                    : ""
                            }
                        />

                        <div
                            className="cd-main"
                            style={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: "16 / 10",
                                borderRadius: "14px",
                                overflow: "hidden",
                                background: "#070707",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            {galleryEmpty || allBroken ? (
                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "block",
                                        backgroundImage: `url("${emptyPlaceholder}")`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                            ) : (
                                <SafeImage
                                    key={active ? active.src : "none"}
                                    src={active ? active.src : ""}
                                    alt={`${brand} ${model}`}
                                    variant="dark"
                                    fit="contain"
                                    title={labels.imageMissing}
                                    showMessage
                                    onError={handleBroken}
                                />
                            )}

                            {gallery.length > 1 ? (
                                <>
                                    <NavButton
                                        side="start"
                                        dir={direction}
                                        step={-1}
                                        onClick={go}
                                        accent={accent}
                                    />
                                    <NavButton
                                        side="end"
                                        dir={direction}
                                        step={1}
                                        onClick={go}
                                        accent={accent}
                                    />
                                </>
                            ) : null}

                            {notice ? (
                                <div
                                    role="status"
                                    className="cd-notice"
                                    style={{
                                        position: "absolute",
                                        bottom: "12px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        padding: "8px 14px",
                                        borderRadius: "999px",
                                        background: "rgba(0,0,0,0.72)",
                                        border: "1px solid rgba(255,255,255,0.16)",
                                        color: "#eee",
                                        fontSize: isFa ? "12px" : "11px",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                        maxWidth: "92%",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {notice}
                                </div>
                            ) : null}
                        </div>

                        {/* بندانگشتی‌ها */}

                        {gallery.length > 1 ? (
                            <div
                                className="cd-thumbs"
                                style={{
                                    display: "flex",
                                    gap: "9px",
                                    marginTop: "12px",
                                    overflowX: "auto",
                                    paddingBottom: "4px",
                                }}
                            >
                                {gallery.map((item, index) => {
                                    const isBroken = brokenSet.has(item.src);
                                    const isActive = index === activeIndex;

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => setSelected(index)}
                                            aria-label={item.label}
                                            aria-current={isActive}
                                            style={{
                                                position: "relative",
                                                flex: "0 0 auto",
                                                width: "104px",
                                                height: "72px",
                                                padding: 0,
                                                cursor: "pointer",
                                                border: isActive
                                                    ? `2px solid ${accent}`
                                                    : "1px solid #262626",
                                                borderRadius: "10px",
                                                overflow: "hidden",
                                                background: "#111",
                                                opacity: isBroken ? 0.55 : 1,
                                            }}
                                        >
                                            <SafeImage
                                                src={item.src}
                                                alt={item.label}
                                                variant="dark"
                                                fit="cover"
                                                onError={handleBroken}
                                            />

                                            <span
                                                style={{
                                                    position: "absolute",
                                                    insetInline: 0,
                                                    bottom: 0,
                                                    padding: "10px 6px 4px",
                                                    background:
                                                        "linear-gradient(transparent, rgba(0,0,0,0.88))",
                                                    color: isBroken ? "#c9a227" : "#fff",
                                                    fontSize: "10px",
                                                    fontWeight: 800,
                                                    textAlign: "center",
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                {isBroken ? labels.imageMissing : item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}

                        {!detail && !fetchFailed && gallery.length === 0 ? (
                            <div style={{ marginTop: "12px", color: "#888", fontSize: "13px" }}>
                                {labels.loading}
                            </div>
                        ) : null}
                    </section>

                    {/* ---------- ستون اطلاعات (بدون تکرار) ---------- */}

                    <div
                        className="cd-side"
                        style={{ display: "flex", flexDirection: "column", gap: "18px" }}
                    >
                        {/* هزینه‌های جانبی — قیمت در هدر آمده، پس این‌جا تکرار نمی‌شود */}

                        {features.shipping !== false || features.customs !== false ? (
                            <section style={cardStyle}>
                                <SectionHead text={labels.costs} isFa={isFa} />

                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {features.shipping !== false ? (
                                        <Row
                                            label={labels.shipping}
                                            value={`${money(data?.shipping_cost)} ${dealerConfig.currency}`}
                                            isFa={isFa}
                                            last={features.customs === false}
                                        />
                                    ) : null}

                                    {features.customs !== false ? (
                                        // طبق تصمیم کاربر: مبلغ گمرک در مجموع
                                        // نمی‌آید و همان «بعهده خریدار» می‌ماند.
                                        <Row
                                            label={labels.customs}
                                            value={labels.customsBuyer}
                                            isFa={isFa}
                                            last
                                        />
                                    ) : null}
                                </div>
                            </section>
                        ) : null}

                        {/* مشخصات */}

                        <section style={cardStyle}>
                            <SectionHead text={labels.specs} isFa={isFa} />

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                    gap: "14px 12px",
                                }}
                            >
                                {specs.map((item) => (
                                    <Field
                                        key={item.label}
                                        label={item.label}
                                        value={item.value}
                                        isFa={isFa}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* نمایندگی / تماس + درخواست بازدید */}

                        <section style={cardStyle}>
                            <SectionHead text={labels.dealer} isFa={isFa} />

                            <div
                                style={{
                                    color: "#eee",
                                    fontSize: isFa ? "16px" : "14px",
                                    fontWeight: 800,
                                    marginBottom: address || phone ? "8px" : 0,
                                }}
                            >
                                {dealerName}
                            </div>

                            {address ? (
                                <div
                                    style={{
                                        color: "#999",
                                        fontSize: isFa ? "13px" : "12px",
                                        lineHeight: 1.8,
                                        marginBottom: phone ? "12px" : 0,
                                    }}
                                >
                                    {address}
                                </div>
                            ) : null}

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {phone ? (
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        <a
                                            href={`tel:${phone}`}
                                            dir="ltr"
                                            style={{
                                                ...buttonBase,
                                                background: accent,
                                                color: "#050505",
                                                borderColor: accent,
                                            }}
                                        >
                                            {labels.call} ·{" "}
                                            <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
                                                {phone}
                                            </span>
                                        </a>

                                        {features.whatsapp && whatsappNumber ? (
                                            <a
                                                href={`https://wa.me/${whatsappNumber}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    ...buttonBase,
                                                    background: "transparent",
                                                    color: "#eee",
                                                }}
                                            >
                                                {labels.whatsapp}
                                            </a>
                                        ) : null}
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onContactRequest) onContactRequest(data);
                                    }}
                                    style={{
                                        width: "100%",
                                        height: "46px",
                                        borderRadius: "12px",
                                        border: "1px solid #d4af37",
                                        background: "linear-gradient(135deg, #e8d27a 0%, #d4af37 25%, #c9a45c 50%, #a9823f 100%)",
                                        color: "#111",
                                        fontSize: "13px",
                                        fontWeight: 900,
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        boxShadow: "0 8px 22px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.4)",
                                        transition: "filter 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                                >
                                    تماس / درخواست بازدید
                                </button>
                            </div>
                        </section>

                        {/* توضیحات */}

                        <section style={cardStyle}>
                            <SectionHead text={labels.description} isFa={isFa} />

                            <div
                                style={{
                                    color: "#ccc",
                                    fontSize: isFa ? "15px" : "13px",
                                    lineHeight: 1.9,
                                    wordBreak: "break-word",
                                }}
                            >
                                {description || labels.noDescription}
                            </div>
                        </section>

                        {fetchFailed ? (
                            <div
                                style={{
                                    ...cardStyle,
                                    padding: "14px 16px",
                                    borderColor: "rgba(255,255,255,0.12)",
                                    color: "#999",
                                    fontSize: "12px",
                                    lineHeight: 1.8,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "10px",
                                }}
                            >
                                <span>{labels.detailFailed}</span>

                                <button
                                    type="button"
                                    onClick={() => setReloadKey((prev) => prev + 1)}
                                    style={{
                                        ...buttonBase,
                                        padding: "7px 12px",
                                        fontSize: "11px",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {labels.retry}
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------
// قطعه‌های کوچک (هرکدام یک‌جا تعریف شده تا تکرار استایل حذف شود)
// ------------------------------------------------------------

const buttonBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "9px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#eee",
    fontSize: "12px",
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
    fontFamily: "inherit",
};

function hexToRgba(hex, alpha) {
    const value = String(hex || "").replace("#", "").trim();

    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        return `rgba(212, 175, 55, ${alpha})`;
    }

    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function LangToggle({ language, onChange, accent, labels }) {
    const item = (value, text) => (
        <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            style={{
                border: "none",
                borderRadius: "8px",
                padding: "7px 12px",
                cursor: "pointer",
                background: language === value ? accent : "transparent",
                color: language === value ? "#050505" : "#999",
                fontWeight: 800,
                fontSize: "11px",
                fontFamily: "inherit",
            }}
        >
            {text}
        </button>
    );

    return (
        <div
            style={{
                display: "flex",
                gap: "4px",
                padding: "4px",
                background: "#151515",
                border: "1px solid #292929",
                borderRadius: "11px",
            }}
        >
            {item("fa", labels.persian)}
            {item("en", labels.english)}
        </div>
    );
}

function Chip({ text, accent, strong }) {
    return (
        <span
            dir="auto"
            style={{
                padding: strong ? "7px 12px" : "6px 11px",
                borderRadius: "8px",
                background: strong ? accent : "rgba(255,255,255,0.06)",
                color: strong ? "#050505" : "#bbb",
                border: strong ? "none" : "1px solid rgba(255,255,255,0.1)",
                fontSize: "12px",
                fontWeight: 800,
                whiteSpace: "nowrap",
            }}
        >
            {text}
        </span>
    );
}

function SectionHead({ text, isFa, right }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "14px",
            }}
        >
            <div
                style={{
                    color: "#aaa",
                    fontSize: isFa ? "15px" : "11px",
                    fontWeight: 900,
                    letterSpacing: isFa ? 0 : "1.8px",
                }}
            >
                {text}
            </div>

            {right ? (
                <div style={{ color: "#666", fontSize: "11px", fontWeight: 700 }}>{right}</div>
            ) : null}
        </div>
    );
}

function Field({ label, value, isFa }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div
                style={{
                    color: "#777",
                    fontSize: isFa ? "12px" : "9px",
                    fontWeight: 800,
                    letterSpacing: isFa ? 0 : "1.4px",
                    marginBottom: "5px",
                }}
            >
                {label}
            </div>

            <div
                dir="auto"
                style={{
                    color: "#eee",
                    fontSize: isFa ? "15px" : "13px",
                    fontWeight: 700,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                }}
            >
                {value}
            </div>
        </div>
    );
}

function Row({ label, value, isFa, last }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "10px 0",
                borderBottom: last ? "none" : "1px solid #1f1f1f",
            }}
        >
            <span
                style={{
                    color: "#888",
                    fontSize: isFa ? "13px" : "11px",
                    fontWeight: 700,
                }}
            >
                {label}
            </span>

            <span
                dir="auto"
                style={{
                    color: "#eee",
                    fontSize: isFa ? "14px" : "12px",
                    fontWeight: 800,
                    textAlign: "end",
                }}
            >
                {value}
            </span>
        </div>
    );
}

function NavButton({ side, dir, step, onClick, accent }) {
    const isStart = side === "start";
    const arrow = step < 0 ? "‹" : "›";

    return (
        <button
            type="button"
            onClick={() => onClick(step)}
            aria-hidden="true"
            tabIndex={-1}
            style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                [isStart ? (dir === "rtl" ? "right" : "left") : dir === "rtl" ? "left" : "right"]:
                    "10px",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.55)",
                color: accent,
                fontSize: "22px",
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
            }}
        >
            {arrow}
        </button>
    );
}

export default CarDetails;
