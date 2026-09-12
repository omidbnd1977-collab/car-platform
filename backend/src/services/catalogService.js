// ------------------------------------------------------------
// کمک‌تابع‌های کاتالوگ (برند / مدل)
// ------------------------------------------------------------
// هم createCar و هم updateCar به «پیدا کن یا بساز» نیاز دارند تا
// ثبت یک خودروی تازه هیچ‌وقت به خاطر نبودن برند/مدل در
// car_brands / car_models شکست نخورد (قبلاً خطای
// "Brand not found: X" برمی‌گشت).
//
// پارامتر اول (runner) می‌تواند استخر (db) یا client یک تراکنش
// باشد؛ برای همین اینجا هیچ fallback مبتنی بر «خطای یکتایی»
// نداریم: داخل تراکنش، هر خطای INSERT کل تراکنش را می‌سوزاند.
// ------------------------------------------------------------

const db = require("../config/database");

function normalizeName(value) {
    return String(value == null ? "" : value).trim().replace(/\s+/g, " ");
}

function query(runner, sql, params) {
    return (runner || db).query(sql, params);
}

/**
 * @returns {Promise<{id:number,name:string,created:boolean}>}
 */
async function findOrCreateBrand(runner, name) {
    const clean = normalizeName(name);

    if (clean.length < 2) {
        const error = new Error("نام برند لازم است (حداقل ۲ حرف).");

        error.statusCode = 400;

        throw error;
    }

    const found = await query(
        runner,
        `
        SELECT id, name
        FROM car_brands
        WHERE LOWER(TRIM(name)) = LOWER($1)
        LIMIT 1
        `,
        [clean]
    );

    if (found.rows.length) {
        return { ...found.rows[0], created: false };
    }

    const inserted = await query(
        runner,
        `
        INSERT INTO car_brands (name)
        VALUES ($1)
        RETURNING id, name
        `,
        [clean]
    );

    return { ...inserted.rows[0], created: true };
}

/**
 * @returns {Promise<{id:number,name:string,brand_id:number,created:boolean}>}
 */
async function findOrCreateModel(runner, brandId, name) {
    const clean = normalizeName(name);

    if (clean.length < 1) {
        const error = new Error("نام مدل لازم است.");

        error.statusCode = 400;

        throw error;
    }

    if (!brandId) {
        const error = new Error("برند برای ساخت مدل لازم است.");

        error.statusCode = 400;

        throw error;
    }

    const found = await query(
        runner,
        `
        SELECT id, name, brand_id
        FROM car_models
        WHERE brand_id = $1
        AND LOWER(TRIM(name)) = LOWER($2)
        LIMIT 1
        `,
        [brandId, clean]
    );

    if (found.rows.length) {
        return { ...found.rows[0], created: false };
    }

    const inserted = await query(
        runner,
        `
        INSERT INTO car_models (name, brand_id)
        VALUES ($1, $2)
        RETURNING id, name, brand_id
        `,
        [clean, brandId]
    );

    return { ...inserted.rows[0], created: true };
}

/** برند/مدل را از نام‌های متنی به رکورد کاتالوگ تبدیل می‌کند. */
async function resolveBrandAndModel(runner, { brand, model, brandId, modelId }) {
    let brandRow = null;

    if (brandId) {
        const byId = await query(
            runner,
            "SELECT id, name FROM car_brands WHERE id = $1",
            [brandId]
        );

        brandRow = byId.rows[0] || null;
    }

    if (!brandRow) {
        brandRow = await findOrCreateBrand(runner, brand);
    }

    let modelRow = null;

    if (modelId) {
        const byId = await query(
            runner,
            "SELECT id, name, brand_id FROM car_models WHERE id = $1",
            [modelId]
        );

        modelRow = byId.rows[0] || null;
    }

    if (!modelRow) {
        modelRow = await findOrCreateModel(runner, brandRow.id, model);
    }

    return { brandRow, modelRow };
}

module.exports = {
    normalizeName,
    findOrCreateBrand,
    findOrCreateModel,
    resolveBrandAndModel,
};
