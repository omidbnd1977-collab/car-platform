// آدرس بک‌اند روی سرور (مثل Render).
// اگر VITE_API_URL ست شده باشد، origin همان استفاده می‌شود،
// در غیر این صورت از مقدار پیش‌فرض (بک‌اند فعلی روی Render)
// استفاده می‌کنیم تا عکس‌ها در دیپلوی شکسته نشوند.
const FALLBACK_ORIGIN = "https://car-platform-db.onrender.com";

function resolveApiOrigin() {
    const rawApiUrl =
        import.meta.env && import.meta.env.VITE_API_URL
            ? String(import.meta.env.VITE_API_URL).trim()
            : "";

    if (!rawApiUrl) {
        return FALLBACK_ORIGIN;
    }

    try {
        return new URL(rawApiUrl).origin;
    } catch (error) {
        return FALLBACK_ORIGIN;
    }
}

const API_ORIGIN = resolveApiOrigin();

export function getImageUrl(value) {
    if (!value) {
        return "";
    }

    const url = String(value).trim();

    if (!url) {
        return "";
    }

    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        return url;
    }

    if (url.indexOf("/") === 0) {
        return API_ORIGIN + url;
    }

    return API_ORIGIN + "/" + url;
}

export default getImageUrl;
