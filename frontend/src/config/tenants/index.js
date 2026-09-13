// ------------------------------------------------------------
// ریجیستری مشتری‌ها (پنل‌های فروخته‌شده)
// ------------------------------------------------------------
// برای هر مشتری یک فایل tenants/<slug>.js + یک خط در این شیء.
// اگر تغییری فراتر از متن/رنگ/لگو/فیچر بود، آن وقت سراغ branch
// اختصاصی برو (docs/tenants.md).
// ------------------------------------------------------------

import { baseDealerConfig } from "./base";
import { qeshmTenant } from "./qeshm";import { smartbrandcarTenant } from "./smartbrandcar";
import { resolveTenantSlug, buildTenantConfig } from "./resolve";

export const tenants = {
    base: {},
    qeshm: qeshmTenant,smartbrandcar: smartbrandcarTenant,
};

export const DEFAULT_TENANT = "qeshm";

function readEnv(name) {
    try {
        return String(import.meta.env?.[name] || "").trim();
    } catch {
        return "";
    }
}

function readQuery() {
    try {
        if (typeof window === "undefined" || !window.location) {
            return "";
        }

        return new URLSearchParams(window.location.search).get("dealer") || "";
    } catch {
        return "";
    }
}

function readStored() {
    try {
        if (typeof window === "undefined" || !window.localStorage) {
            return "";
        }

        return window.localStorage.getItem("cp_tenant") || "";
    } catch {
        return "";
    }
}

function readHost() {
    try {
        return typeof window === "undefined" ? "" : window.location?.hostname || "";
    } catch {
        return "";
    }
}

/** اسم tenant فعال (برای لاگ، پنل ادمین و عیب‌یابی دیپلوی) */
export const tenantSlug = resolveTenantSlug({
    query: readQuery(),
    stored: readStored(),
    hostname: readHost(),
    env: readEnv("VITE_TENANT") || readEnv("TENANT"),
    fallback: DEFAULT_TENANT,
    registry: tenants,
});

/**
 * config نهایی مشتری = قالب پایه + override همان tenant.
 * یک‌بار در ماژول محاسبه و export می‌شود (ساده و predictable).
 */
export const dealerConfig = buildTenantConfig(baseDealerConfig, [tenants[tenantSlug] || {}]);

export function listTenants() {
    return Object.keys(tenants).map((slug) => ({
        slug,
        name: tenants[slug]?.name || baseDealerConfig.name,
    }));
}

export default dealerConfig;
