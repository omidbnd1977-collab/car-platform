// ------------------------------------------------------------
// قالب پایه (base template)
// ------------------------------------------------------------
// این فایل «پوسته‌ی عمومی» محصول است: همان مقدارهایی که قبل از
// چندمشتری‌شدن در dealerConfig.js بودند. تغییرات اختصاصی یک مشتری
// هرگز نباید این فایل را دست بزند؛ برای هر پنل فروخته‌شده یک فایل
// در کنار همین‌جا می‌سازیم (tenants/<slug>.js) که فقط تفاوت‌ها را
// override می‌کند. راهنمای کامل: docs/tenants.md
// ------------------------------------------------------------

export const baseDealerConfig = {
    // =========================
    // DEALERSHIP IDENTITY
    // =========================
    name: "CAR PLATFORM",
    shortName: "CAR PLATFORM",

    // =========================
    // LOCATION
    // =========================
    city: "",
    country: "UAE",

    cityFa: "",
    countryFa: "",

    cityEn: "",
    countryEn: "",

    // =========================
    // CONTACT
    // =========================
    phone: "",
    whatsapp: "",
    email: "",
    instagram: "",

    // =========================
    // BRANDING
    // =========================
    logo: "",
    primaryColor: "#d4af37",
    secondaryColor: "#050505",

    // =========================
    // CURRENCY
    // =========================
    currency: "AED",

    // =========================
    // LANGUAGE
    // =========================
    defaultLanguage: "fa",
    supportedLanguages: ["fa", "en"],

    // =========================
    // FEATURES
    // =========================
    features: {
        whatsapp: true,
        shipping: true,
        customs: true,
        financing: false,
        testDrive: false,
    },

    // شناسه‌ی tenant برای لاگ و پنل ادمین
    tenant: "base",
};

export default baseDealerConfig;
