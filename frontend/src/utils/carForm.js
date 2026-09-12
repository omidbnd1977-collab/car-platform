// ------------------------------------------------------------
// منطق خالص فرم «افزودن خودرو»
// ------------------------------------------------------------
// عمداً داخل یک فایل جدا و بدون JSX نوشته شده تا هم کامپوننت
// و هم تست‌ها از یک منبع استفاده کنند.
// ------------------------------------------------------------

export const YEAR_MIN = 1970;

// کشورها به‌صورت لیست انتخابی‌اند تا تایپ دستی نباشد
export const COUNTRY_OPTIONS = [
    "UAE",
    "Iran",
    "China",
    "Germany",
    "Japan",
    "South Korea",
    "USA",
    "UK",
    "Italy",
    "France",
    "India",
    "Turkey",
];

export const FIELD_LABELS = {
    brand: "برند",
    model: "مدل",
    year: "سال تولید",
    country: "کشور",
    price_aed: "قیمت",
    shipping_cost: "هزینه لندیکرافت",
    customs_cost: "هزینه گمرک",
    dealership_name: "نمایندگی / شو روم",
    description: "توضیحات",
};

/**
 * گزینه‌های سال تولید (از سال بعد تا YEAR_MIN، نزولی).
 */
export function buildYearOptions(currentYear = new Date().getFullYear()) {
    const from = currentYear + 1;
    const options = [];

    for (let year = from; year >= YEAR_MIN; year -= 1) {
        options.push({ value: String(year), label: String(year) });
    }

    return options;
}

/** برچسب خوانا برای نمایندگی (نام + شهر) */
export function dealershipLabel(dealership) {
    const name = clean(dealership?.name);
    const city = clean(dealership?.city);

    if (!name) {
        return "";
    }

    return city ? `${name} — ${city}` : name;
}

export function clean(value) {
    return String(value == null ? "" : value).trim();
}

// پیدا کردن آیتم کاتالوگ بدون حساسیت به بزرگی/کوچکی و فاصله
export function findByName(list, name) {
    const target = clean(name).toLowerCase();

    if (!target || !Array.isArray(list)) {
        return null;
    }

    return (
        list.find((item) => clean(item?.name).toLowerCase() === target) ||
        null
    );
}

export function inCatalog(list, name) {
    return Boolean(findByName(list, name));
}

function toNumber(value) {
    const raw = clean(value).replace(/[,_\s]/g, "");

    if (raw === "") {
        return null;
    }

    const num = Number(raw);

    return Number.isFinite(num) ? num : NaN;
}

/**
 * اعتبارسنجی فرم.
 * @returns {{ valid: boolean, errors: Record<string,string> }}
 */
export function validateCarForm(form = {}, options = {}) {
    const currentYear = Number(options.currentYear) || new Date().getFullYear();
    const yearMax = currentYear + 2;

    const errors = {};

    if (!clean(form.brand)) {
        errors.brand = "برند را از لیست انتخاب کنید.";
    }

    if (!clean(form.model)) {
        errors.model = "مدل را از لیست انتخاب کنید (اگر در لیست نیست، از بخش «افزودن به کاتالوگ» اضافه‌اش کنید).";
    }

    const year = toNumber(form.year);

    if (year === null) {
        errors.year = "سال تولید را وارد کنید.";
    } else if (Number.isNaN(year) || !Number.isInteger(year) || year < YEAR_MIN || year > yearMax) {
        errors.year = `سال باید یک عدد صحیح بین ${YEAR_MIN} تا ${yearMax} باشد.`;
    }

    const price = toNumber(form.price_aed);

    if (price === null) {
        errors.price_aed = "قیمت را وارد کنید.";
    } else if (Number.isNaN(price) || price <= 0) {
        errors.price_aed = "قیمت باید یک عدد بزرگ‌تر از صفر باشد.";
    }

    for (const field of ["shipping_cost", "customs_cost"]) {
        const value = toNumber(form[field]);

        if (value !== null && (Number.isNaN(value) || value < 0)) {
            errors[field] = `${FIELD_LABELS[field]} باید یک عدد نامنفی باشد.`;
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * ساخت بدنه‌ی درخواست POST /api/cars
 * (نام برند و مدل باید دقیقاً با کاتالوگ یکی باشد؛ این‌جا
 * اگر از لیست انتخاب شده همان نامِ کاتالوگ را می‌گذاریم).
 */
export function buildCarPayload(form = {}, options = {}) {
    const brands = Array.isArray(options.brands) ? options.brands : [];
    const models = Array.isArray(options.models) ? options.models : [];

    // اگر از دراپ‌داون انتخاب شده، همان نامِ کاتالوگ را می‌فرستیم
    // تا createCar دقیقاً مچ کند (وگرنه خطای "Brand not found" می‌گیرد).
    const brandRow = findByName(brands, form.brand);
    const modelRow = findByName(models, form.model);

    const brandName = brandRow ? brandRow.name : clean(form.brand);
    const modelName = modelRow ? modelRow.name : clean(form.model);

    const price = toNumber(form.price_aed);
    const shipping = toNumber(form.shipping_cost);
    const customs = toNumber(form.customs_cost);
    const country = clean(form.country) || clean(options.defaultCountry) || "";

    return {
        brand: brandName,
        model: modelName,
        year: toNumber(form.year),
        country,
        price_aed: price,
        // هزینه‌های خالی = صفر، تا Postgres عددی بودن را حفظ کند
        shipping_cost: shipping === null ? 0 : shipping,
        customs_cost: customs === null ? 0 : customs,
        dealership_name: clean(form.dealership_name) || clean(options.defaultDealership) || null,
        description: clean(form.description),
    };
}

/** خلاصه‌ی نتیجه‌ی آپلود عکس‌ها برای نمایش به کاربر */
export function summarizeUploads(results = []) {
    const uploaded = results.filter((item) => item?.ok).length;
    const failed = results.filter((item) => item && !item.ok);

    return {
        uploaded,
        failed,
        message: failed.length
            ? `${uploaded} عکس ثبت شد، ${failed.length} عکس ناموفق: ` +
              failed.map((f) => `${f.name} (${f.error})`).join(" | ")
            : uploaded
            ? `${uploaded} عکس ثبت شد`
            : "",
    };
}

// ------------------------------------------------------------
// استایل‌های مشترک (این‌جا نگه داشته می‌شوند تا فایل .jsx فقط
// کامپوننت export کند و قانون react-refresh نشکند)
// ------------------------------------------------------------
export const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d8d8d8",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
    boxSizing: "border-box",
    fontFamily: "inherit",
};

export const selectStyle = {
    ...inputStyle,
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage:
        "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='2' fill='none'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    // در RTL متن از راست شروع می‌شود؛ شِوُن سمت چپ است → فاصله از چپ بیشتر
    backgroundPosition: "left 12px center",
    paddingLeft: "34px",
    paddingRight: "12px",
    cursor: "pointer",
};

export const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#333",
};

export const hintStyle = { color: "#999", fontSize: "11px", marginTop: "5px" };
export const errorTextStyle = { color: "#c62828", fontSize: "12px", marginTop: "5px" };

/** برندها را از خروجی GET /api/catalog/full می‌خواند (ساختار امن) */
export function normalizeCatalogBrands(brands) {
    if (!Array.isArray(brands)) {
        return [];
    }

    return brands
        .filter((brand) => clean(brand?.name))
        .map((brand) => ({
            id: brand.id ?? null,
            name: clean(brand.name),
            in_catalog: brand.in_catalog !== false,
            cars_count: Number(brand.cars_count) || 0,
            models: Array.isArray(brand.models)
                ? brand.models
                      .filter((model) => clean(model?.name))
                      .map((model) => ({
                          id: model.id ?? null,
                          name: clean(model.name),
                          brand_id: model.brand_id ?? brand.id ?? null,
                          brand_name: clean(model.brand_name) || clean(brand.name),
                          in_catalog:
                              model.in_catalog === undefined
                                  ? brand.in_catalog !== false
                                  : model.in_catalog !== false,
                      }))
                : [],
        }));
}

/**
 * لیست تخت برندها (GET /api/catalog/brands، نسخه‌ی قدیمی بک‌اند) را با
 * مدل‌های هر برند (GET /api/catalog/models/:brandId) ادغام می‌کند.
 * فقط وقتی لازم است که /api/catalog/full روی هاست نباشد.
 */
export function mergeBrandsWithModels(brands, modelsByBrandId) {
    const map =
        modelsByBrandId instanceof Map
            ? modelsByBrandId
            : new Map(Object.entries(modelsByBrandId || {}));

    return normalizeCatalogBrands(
        (Array.isArray(brands) ? brands : []).map((brand) => {
            const list = map.get(String(brand?.id)) || [];

            return { ...brand, models: list };
        })
    );
}

/** مدل‌های یک برند (بدون حساسیت به حروف). اگر برند پیدا نشد، همه را می‌دهد. */
export function modelsOfBrand(brands, brandName) {
    const brand = findByName(brands, brandName);

    if (brand) {
        return brand.models;
    }

    return brands.flatMap((item) => item.models);
}

/**
 * گزینه‌های کمبوکس مدل، گروه‌بندی‌شده بر اساس برند.
 * اگر برندی انتخاب نشده باشد «مدل‌های همه‌ی برندها» نمایش داده می‌شود
 * تا کاربر مجبور نباشد اول برند را حدس بزند؛ با انتخاب مدل، برند هم
 * خودش پر می‌شود (برندِ همان مدل).
 */
export function buildModelGroups(brands, brandName) {
    const chosen = findByName(brands, brandName);

    if (chosen) {
        return [
            {
                label: chosen.name,
                options: chosen.models.map((model) => ({
                    value: model.name,
                    label: model.name,
                    brandName: chosen.name,
                })),
            },
        ];
    }

    return brands
        .filter((brand) => brand.models.length)
        .map((brand) => ({
            label: `${brand.name}${brand.cars_count ? ` (${brand.cars_count})` : ""}`,
            options: brand.models.map((model) => ({
                value: model.name,
                label: model.name,
                brandName: brand.name,
            })),
        }));
}

/** برندِ یک مدل (برای اینکه با انتخاب مدل، برند خودکار ست شود) */
export function brandOfModel(brands, modelName) {
    const key = clean(modelName).toLowerCase();

    if (!key) {
        return null;
    }

    for (const brand of brands) {
        const hit = brand.models.find((model) => clean(model.name).toLowerCase() === key);

        if (hit) {
            return brand.name;
        }
    }

    return null;
}

/**
 * بدنه‌ی درخواست PUT /api/cars/:id
 * مثل buildCarPayload است، با این فرق که همه‌چیز ارسال می‌شود
 * (backend فیلدهای ارسال‌نشده را با COALESCE نگه می‌دارد) و
 * status هم اختیاری است.
 */
export function buildUpdatePayload(form = {}, options = {}) {
    const payload = buildCarPayload(form, options);

    const status = clean(form.status);

    if (status) {
        payload.status = status;
    }

    return payload;
}

/** خلاصه‌ی کوتاه برای پیام «چه چیزی عوض شد» */
export function describeChange(before = {}, after = {}) {
    const changed = [];

    for (const key of Object.keys(FIELD_LABELS)) {
        const from = clean(before[key]);
        const to = clean(after[key]);

        if (to !== "" && from !== to) {
            changed.push(`${FIELD_LABELS[key]}: ${from || "—"} ← ${to}`);
        }
    }

    return changed;
}
