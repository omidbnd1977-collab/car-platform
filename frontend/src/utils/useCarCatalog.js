import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "./apiBase";
import { adminFetch, readError } from "./adminAuth";
import { countReadyOnlyBrands, mergeGlobalCatalog } from "./globalCatalog";
import {
    buildModelGroups,
    clean,
    mergeBrandsWithModels,
    normalizeCatalogBrands,
} from "./carForm";

// ------------------------------------------------------------
// کاتالوگ + نمایندگی‌ها، یک‌بار و برای همه‌ی کمبوکس‌ها
// ------------------------------------------------------------
// GET /api/catalog/full همه‌ی برندها را با مدل‌هایشان می‌دهد
// (به‌علاوه‌ی برندها/مدل‌هایی که فقط در جدول cars هستند)، پس فرم
// خودرو دیگر نه N+1 درخواست می‌زند نه «لیست ناقص».
// ------------------------------------------------------------

/**
 * کاتالوگ را می‌خواند. اگر بک‌اند روی هاست هنوز GET /api/catalog/full را
 * ندارد، به دو روت قدیمی برمی‌گردد تا کمبوکس‌ها هیچ‌وقت بی‌گزینه نمانند.
 */
async function loadCatalog() {
    const fullRes = await fetch(apiUrl("catalog/full")).catch(() => null);

    if (fullRes?.ok) {
        try {
            const data = await fullRes.json();
            const brands = normalizeCatalogBrands(data?.brands);

            if (brands.length) {
                return { brands: mergeGlobalCatalog(brands), source: "full" };
            }
        } catch {
            /* پاسخ JSON نبود (مثلاً صفحه‌ی خطای هاست) → مسیر legacy */
        }
    }

    const brandsRes = await fetch(apiUrl("catalog/brands"));

    if (!brandsRes.ok) {
        throw new Error(`HTTP ${brandsRes.status}`);
    }

    const brandsData = await brandsRes.json();
    const flat = normalizeCatalogBrands(
        (Array.isArray(brandsData?.brands) ? brandsData.brands : []).map((brand) => ({
            ...brand,
            models: [],
        }))
    );

    const lists = await Promise.all(
        flat.map(async (brand) => {
            try {
                const res = await fetch(apiUrl(`catalog/models/${brand.id}`));

                return res.ok ? (await res.json())?.models || [] : [];
            } catch {
                return [];
            }
        })
    );

    const byId = new Map(flat.map((brand, index) => [String(brand.id), lists[index]]));

    return {
        brands: mergeGlobalCatalog(mergeBrandsWithModels(flat, byId)),
        source: "legacy",
    };
}

export function useCarCatalog() {
    const [brands, setBrands] = useState([]);
    const [dealerships, setDealerships] = useState([]);
    const [state, setState] = useState("loading");
    const [dealershipState, setDealershipState] = useState("loading");
    const [error, setError] = useState("");
    // "full"   = از GET /api/catalog/full (بک‌اند به‌روز)
    // "legacy" = از GET /api/catalog/brands + /models/:brandId (بک‌اند قدیمی)
    const [source, setSource] = useState("full");

    const load = useCallback(async () => {
        try {
            const [catalog, dealershipsRes] = await Promise.all([
                loadCatalog(),
                fetch(apiUrl("dealerships")).catch(() => null),
            ]);

            setBrands(catalog.brands);
            setSource(catalog.source);
            setState("ready");
            setError("");

            if (dealershipsRes?.ok) {
                const dealershipsData = await dealershipsRes.json();

                setDealerships(
                    Array.isArray(dealershipsData?.dealerships) ? dealershipsData.dealerships : []
                );
                setDealershipState("ready");
            } else {
                setDealerships([]);
                setDealershipState("unavailable");
            }
        } catch (loadError) {
            console.error("LOAD CATALOG ERROR:", loadError);

            setState("error");
            setDealershipState("unavailable");
            setError(
                "لیست کاتالوگ بارگذاری نشد. اگر بک‌اند را به‌روز نکرده‌ای، اول همان را " +
                    "دیپلوی کن. (" +
                    (loadError?.message || "خطای شبکه") +
                    ")"
            );
        }
    }, []);

    useEffect(() => {
        (async () => {
            await load();
        })();
    }, [load]);

    const brandOptions = useMemo(
        () =>
            brands.map((brand) => ({
                value: brand.name,
                label: `${brand.name}${
                    brand.is_global ? " (لیست آماده)" : brand.in_catalog ? "" : " (بدون کاتالوگ)"
                }`,
            })),
        [brands]
    );

    // فقط مدل‌های کاتالوگ (دیتابیس) — لیست آماده ۱۵۰۰ مدل دارد و همه‌جا لازم نیست
    const allModels = useMemo(
        () =>
            brands
                .flatMap((brand) => brand.models || [])
                .filter((model) => model?.from_db !== false),
        [brands]
    );

    /** چند برند فقط از لیست آماده‌اند (هنوز در دیتابیس نیستند) */
    const readyOnlyCount = useMemo(() => countReadyOnlyBrands(brands), [brands]);
    const dbBrandCount = useMemo(() => brands.filter((brand) => brand?.id).length, [brands]);

    return {
        brands,
        allModels,
        dealerships,
        state,
        source,
        dealershipState,
        error,
        brandOptions,
        readyOnlyCount,
        dbBrandCount,
        load,
        setBrands,
    };
}

/** گزینه‌های مدل (گروه‌بندی‌شده با برند) برای یک form مشخص */
export function useModelGroups(brands, brandName) {
    const brandKey = clean(brandName);

    return useMemo(
        () => buildModelGroups(brands, brandKey),
        [brands, brandKey]
    );
}

/**
 * افزودن برند/مدل به کاتالوگ — تنها جایی که تایپ نام مجاز است.
 * بعد از هر افزودن، لیست‌ها از سرور دوباره خوانده می‌شوند.
 */
export function useCatalogWriter(load) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const add = useCallback(
        async ({ brand, model }) => {
            const brandName = clean(brand);
            const modelName = clean(model);
            const result = { brandName, modelName, brandId: null };

            if (!brandName && !modelName) {
                setError("نام برند یا مدل را بنویس.");

                return { ok: false, result };
            }

            try {
                setSaving(true);
                setError("");

                if (brandName) {
                    const res = await adminFetch(apiUrl("catalog/brands"), {
                        method: "POST",
                        body: JSON.stringify({ name: brandName }),
                    });

                    if (!res.ok) {
                        throw new Error("افزودن برند ناموفق بود: " + (await readError(res)));
                    }

                    const data = await res.json();

                    result.brandId = data?.brand?.id ?? null;
                    result.brandName = data?.brand?.name || brandName;
                }

                if (modelName) {
                    const res = await adminFetch(apiUrl("catalog/models"), {
                        method: "POST",
                        body: JSON.stringify({
                            name: modelName,
                            ...(result.brandId ? { brand_id: result.brandId } : { brand: result.brandName }),
                        }),
                    });

                    if (!res.ok) {
                        throw new Error("افزودن مدل ناموفق بود: " + (await readError(res)));
                    }

                    const data = await res.json();

                    result.modelName = data?.model?.name || modelName;
                }

                await load();

                return { ok: true, result };
            } catch (addError) {
                setError(addError?.message || "افزودن به کاتالوگ ناموفق بود");

                return { ok: false, result };
            } finally {
                setSaving(false);
            }
        },
        [load]
    );

    return { add, saving, error, clearError: () => setError("") };
}

export default useCarCatalog;
