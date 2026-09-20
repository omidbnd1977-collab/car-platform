// ------------------------------------------------------------
// آدرس پایه‌ی API — یک‌جا - فیکس hard-code
// ------------------------------------------------------------
// قبلاً DEFAULT_API_URL = "https://car-platform-db.onrender.com/api" hard-code بود
// الان:
// - اولویت 1: VITE_API_URL از ENV (برای multi-tenant هر سرویس URL خودش)
// - اولویت 2: اگر روی همون دامنه هستیم، از origin + /api
// - اولویت 3: relative /api (برای dev یا proxy)
// هیچ hard-code دامنه‌ای نیست - تغییر دامنه فقط با ENV
// ------------------------------------------------------------

function readEnv(name) {
    try {
        return String(import.meta.env?.[name] || "").trim();
    } catch {
        return "";
    }
}

function getDefaultApiUrl() {
    const envUrl = readEnv("VITE_API_URL");
    if (envUrl) return envUrl;

    // اگر در مرورگر هستیم، از origin استفاده کن (multi-tenant friendly)
    try {
        if (typeof window !== "undefined" && window.location && window.location.origin) {
            // اگر فرانت و بک روی یک دامنه نیستند، باز هم /api نسبی کار می‌کند اگر proxy باشد
            // در غیر این صورت باید VITE_API_URL ست شود - اینجا fallback امن می‌دهیم
            return `${window.location.origin.replace(/\/+$/, "")}/api`;
        }
    } catch {}

    // fallback برای SSR یا تست - relative
    return "/api";
}

export const DEFAULT_API_URL = getDefaultApiUrl();

export const API_BASE = readEnv("VITE_API_URL") || DEFAULT_API_URL;

export function apiUrl(path = "") {
    const clean = String(path).trim();
    if (!clean) {
        return API_BASE;
    }
    return `${API_BASE.replace(/\/+$/, "")}/${clean.replace(/^\/+/, "")}`;
}

export default API_BASE;
