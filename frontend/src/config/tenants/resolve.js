// ------------------------------------------------------------
// منطق خالص انتخاب tenant و ادغام overrideها
// ------------------------------------------------------------
// عمداً هیچ window یا import.meta داخل این فایل نیست تا بتوان
// مستقیم تستش کرد. index.js ورودی‌ها را از محیط می‌خواند و این‌جا
// فقط تصمیم می‌گیرد.
// ------------------------------------------------------------

function slugify(value) {
    return String(value == null ? "" : value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * اولویت انتخاب:
 *   ۱) ?dealer=slug  (برای پیش‌نمایش سریع مشتری)
 *   ۲) localStorage  (مهمانِ همان مرورگر)
 *   ۳) زیردامه: acme.example.com → acme
 *   ۴) env VITE_TENANT / TENANT
 *   ۵) tenant پیش‌فرض
 * فقط slugهایی که در registry وجود دارند پذیرفته می‌شوند؛ اگر نبود،
 * به پیش‌فرض برمی‌گردد (هیچ وقت پنل سفید/خراب نمی‌شود).
 */
export function resolveTenantSlug({ query, stored, hostname, env, fallback = "base", registry = {} } = {}) {
    const candidates = [query, stored, firstHostLabel(hostname), env, fallback];

    for (const candidate of candidates) {
        const slug = slugify(candidate);

        if (slug && Object.prototype.hasOwnProperty.call(registry, slug)) {
            return slug;
        }
    }

    return slugify(fallback) || "base";
}

function firstHostLabel(hostname) {
    const host = String(hostname || "").trim().toLowerCase();

    if (!host || !host.includes(".")) {
        return "";
    }

    const first = host.split(".")[0];

    // دامنه‌های پیش‌فرض هاست (render/netlify/vercel/localhost) tenant نیستند
    if (/^(localhost|127|.+\.onrender|.+\.netlify|.+\.vercel|car-platform)/i.test(host)) {
        return "";
    }

    return first;
}

/** override یک‌لایه + ادغام عمقیِ آبجکت‌های کوچک (مثل features) */
export function mergeConfig(base = {}, override = {}) {
    const out = { ...base };

    for (const [key, value] of Object.entries(override || {})) {
        const isPlainObject =
            value && typeof value === "object" && !Array.isArray(value);

        out[key] =
            isPlainObject && base[key] && typeof base[key] === "object"
                ? { ...base[key], ...value }
                : value;
    }

    return out;
}

/** همه‌ی overrideهای یک مشتری را روی هم می‌نشاند (مثلاً brand + theme) */
export function buildTenantConfig(base, overrides = []) {
    return overrides.reduce((acc, override) => mergeConfig(acc, override), { ...base });
}

export { slugify };
