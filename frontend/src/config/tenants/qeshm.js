// ------------------------------------------------------------
// مشتری: QESHM SMART AUTO (پنل اصلی/نمونه)
// ------------------------------------------------------------
// فقط «تفاوت با قالب پایه» این‌جا نوشته می‌شود؛ بقیه‌ی کلیدها از
// tenants/base.js می‌آیند. دقیقاً همان مقدارهایی که قبل از این
// تغییر در dealerConfig.js بود، تا رفتار سایت روی Render عوض نشود.
// ------------------------------------------------------------

export const qeshmTenant = {
    tenant: "qeshm",

    name: "QESHM SMART AUTO",
    shortName: "QESHM SMART AUTO",

    city: "Qeshm",
    country: "Iran",

    cityFa: "قشم",
    countryFa: "ایران",

    cityEn: "Qeshm",
    countryEn: "Iran",

    primaryColor: "#d4af37",
    secondaryColor: "#050505",

    currency: "AED",

    features: {
        whatsapp: true,
        shipping: true,
        customs: true,
        financing: false,
        testDrive: false,
    },
};

export default qeshmTenant;
