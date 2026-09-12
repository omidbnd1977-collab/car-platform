// ------------------------------------------------------------
// آدرس پایه‌ی API — یک‌جا
// ------------------------------------------------------------
// قبلاً بعضی فایل‌ها VITE_API_URL را می‌خواندند و بعضی آدرس
// production را hard-code کرده بودند (AdminCars و EditCar). این‌جا
// هر دو رفتار حفظ شده تا اگر env ست نشد مثل قبل کار کند.
// برای پنل‌های فروخته‌شده (tenant) می‌توان VITE_API_URL هر سرویس
// را عوض کرد؛ فایل config/tenants را هم ببین.
// ------------------------------------------------------------

function readEnv(name) {
    try {
        return String(import.meta.env?.[name] || "").trim();
    } catch {
        return "";
    }
}

export const DEFAULT_API_URL = "https://car-platform-db.onrender.com/api";

export const API_BASE = readEnv("VITE_API_URL") || DEFAULT_API_URL;

/** `${API_BASE}/cars` … */
export function apiUrl(path = "") {
    const clean = String(path).trim();

    if (!clean) {
        return API_BASE;
    }

    return `${API_BASE.replace(/\/+$/, "")}/${clean.replace(/^\/+/, "")}`;
}

export default API_BASE;
