// ------------------------------------------------------------
// کلید ادمین (سمت فرانت)
// ------------------------------------------------------------
// بک‌اند با adminGuard کلید را از هدر `x-admin-key` می‌خواند و
// مقدارش از env `ADMIN_API_KEY` می‌آید. تا وقتی آن env تنظیم نشده
// گارد خاموش است و این توابع عملاً بی‌اثرند (هدر خالی فرستاده نمی‌شود).
//
// کلید در localStorage می‌ماند تا با هر بار باز کردن پنل لازم نباشد
// دوباره تایپ شود. همه‌چیز با گارد `typeof window` نوشته شده تا
// رندر سمت سرور/تست نمی‌شکند.
// ------------------------------------------------------------

export const ADMIN_KEY_STORAGE = "cp_admin_key";

function hasWindow() {
    return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getAdminKey() {
    if (!hasWindow()) {
        return "";
    }

    try {
        return String(window.localStorage.getItem(ADMIN_KEY_STORAGE) || "").trim();
    } catch {
        return "";
    }
}

export function setAdminKey(key) {
    const clean = String(key == null ? "" : key).trim();

    if (!hasWindow()) {
        return clean;
    }

    try {
        if (clean) {
            window.localStorage.setItem(ADMIN_KEY_STORAGE, clean);
        } else {
            window.localStorage.removeItem(ADMIN_KEY_STORAGE);
        }
    } catch (error) {
        console.warn("ADMIN KEY SAVE ERROR:", error.message);
    }

    return clean;
}

export function clearAdminKey() {
    return setAdminKey("");
}

/** فقط وقتی کلید هست هدر اضافه می‌شود (تا حالت cache-safe بماند). */
export function adminHeaders(extra = {}) {
    const key = getAdminKey();
    const headers = { ...extra };

    if (key) {
        headers["x-admin-key"] = key;
    }

    return headers;
}

/** برای fetch؛ بدنه‌ی JSON را هم همان‌جا می‌سازد. */
export function adminFetch(url, options = {}) {
    const isJsonBody = options.body != null && typeof options.body !== "string" && !(options.body instanceof FormData);

    const headers = adminHeaders({
        ...(options.headers || {}),
        ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
    });

    return fetch(url, {
        ...options,
        headers,
        body: isJsonBody ? JSON.stringify(options.body) : options.body,
    });
}

export function isUnauthorized(response) {
    return Number(response?.status) === 401;
}

/** پیام خطای پاسخ (JSON یا متنی) */
export async function readError(response, fallback = "عملیات ناموفق بود.") {
    let text;

    try {
        text = await response.text();
    } catch {
        text = "";
    }

    if (!text) {
        return response?.status === 413
            ? "حجم فایل بیش از حد مجاز است."
            : `${fallback} (کد: ${response?.status})`;
    }

    try {
        const data = JSON.parse(text);

        return String(data?.error || data?.message || data?.msg || text).trim() || fallback;
    } catch {
        // پاسخ HTML (صفحه‌ی خطای پراکسی/۵۰۲) را به‌صورت خام نشان نده
        if (/<\s*(html|body|!doctype)/i.test(text)) {
            return `${fallback} (کد: ${response?.status})`;
        }

        return text.trim().slice(0, 300);
    }
}

/**
 * بررسی درستی رمز، بدون نوشتن چیزی در دیتابیس.
 * POST /api/catalog/brands با نام یک‌حرفی می‌فرستیم: اگر گارد رمز را
 * قبول کند به اعتبارسنجی می‌رسیم و ۴۰۰ می‌گیریم، اگر قبول نکند ۴۰۱.
 */
export async function verifyAdminKey(apiBase) {
    try {
        const res = await adminFetch(`${apiBase}/catalog/brands`, {
            method: "POST",
            body: JSON.stringify({ name: "x" }),
        });

        if (res.status === 401 || res.status === 403) {
            return { ok: false, reason: "wrong-key", status: res.status };
        }

        // ۴۰۰ یعنی از گارد رد شد و به اعتبارسنجی نام رسید ✓
        return { ok: true, status: res.status };
    } catch {
        return { ok: false, reason: "network", status: 0 };
    }
}

/**
 * آیا گارد روی سرور روشن است؟  GET /api/admin/status
 * @returns {Promise<{enabled:boolean, jwt_enabled:boolean}|null>}
 */
export async function fetchGuardStatus(apiBase) {
    try {
        const res = await fetch(`${apiBase}/admin/status`);

        if (!res.ok) {
            return null;
        }

        const data = await res.json();

        return {
            enabled: Boolean(data?.enabled),
            jwt_enabled: Boolean(data?.jwt_enabled),
        };
    } catch {
        return null;
    }
}
