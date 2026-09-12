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

/**
 * برای fetch؛ بدنه‌ی JSON را هم همان‌جا می‌سازد.
 *
 * نکته‌ی مهم: Content-Type باید همیشه برای بدنه‌ی non-FormData فرستاده شود.
 * اگر فراموش شود، express.json() در بک‌اند بدنه را نمی‌خواند و req.body
 * تعریف‌نشده می‌ماند → «Cannot destructure property ... of 'req.body'».
 * (فایل بدنه اینجا رشته‌ی JSON است، پس نمی‌شود فقط به typeof نگاه کرد.)
 */
export function adminFetch(url, options = {}) {
    const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
    const hasBody = options.body != null && !isForm;

    const given = options.headers || {};
    // فقط وقتی هیچ Content-Type‌ای ست نکرده‌اند JSON فرض می‌کنیم؛
    // اگر خودشان چیزی فرستاده‌اند (مثلاً text/plain) دست نمی‌زنیم.
    const wantsJson = hasBody && !hasContentType(given);

    const headers = adminHeaders({
        ...given,
        ...(wantsJson ? { "Content-Type": "application/json" } : {}),
    });

    return fetch(url, {
        ...options,
        headers,
        // اگر از قبل رشته‌ی JSON فرستاده‌اند دست نمی‌زنیم، وگرنه همین‌جا می‌سازیم
        body: hasBody && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
    });
}

/** آیا caller خودش Content-Type ست کرده؟ (با هر بزرگی/کوچکی) */
function hasContentType(headers = {}) {
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
        return headers.get("content-type") != null;
    }

    if (Array.isArray(headers)) {
        return headers.some(([key]) => String(key).toLowerCase() === "content-type");
    }

    return Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
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
