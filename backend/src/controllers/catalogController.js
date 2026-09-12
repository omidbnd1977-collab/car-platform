const db = require("../config/database");


// دریافت همه برندها
exports.getBrands = async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT id, name
            FROM car_brands
            ORDER BY name
            `
        );


        res.json({
            brands: result.rows
        });


    } catch(error){

        res.status(500).json({
            error:error.message
        });

    }

};



// دریافت مدل‌های یک برند
exports.getModelsByBrand = async (req,res)=>{

    try {


        const { brandId } = req.params;


        const result = await db.query(
            `
            SELECT id, name
            FROM car_models
            WHERE brand_id=$1
            ORDER BY name
            `,
            [brandId]
        );


        res.json({
            models: result.rows
        });



    } catch(error){

        res.status(500).json({
            error:error.message
        });

    }

};

// ============================================================
// FIND OR CREATE BRAND
// POST /api/catalog/brands   { name }
// ============================================================
// برای اینکه پنل «افزودن خودرو» وقتی برندی در کاتالوگ نیست
// گیر نکند (createCar با خطای "Brand not found" رد می‌شود).
// اگر نام (بدون حساسیت به حروف بزرگ/کوچک) موجود باشد، همان
// رکورد برگردانده می‌شود و چیزی درج نمی‌شود.
// ============================================================

function cleanName(value, label, max) {

    const name = String(value == null ? "" : value).trim().replace(/\s+/g, " ");

    if (name.length < 2) {
        return { error: label + " لازم است (حداقل ۲ حرف)" };
    }

    if (name.length > max) {
        return { error: label + " نباید بیشتر از " + max + " حرف باشد" };
    }

    return { name };
}

exports.createBrand = async (req, res) => {

    try {

        const { name, error } = cleanName(req.body?.name, "نام برند", 60);

        if (error) {
            return res.status(400).json({ error });
        }

        const existing = await db.query(
            `
            SELECT id, name
            FROM car_brands
            WHERE LOWER(TRIM(name)) = LOWER($1)
            LIMIT 1
            `,
            [name]
        );

        if (existing.rows.length) {
            return res.json({
                brand: existing.rows[0],
                created: false
            });
        }

        try {

            const inserted = await db.query(
                `
                INSERT INTO car_brands (name)
                VALUES ($1)
                RETURNING id, name
                `,
                [name]
            );

            return res.status(201).json({
                brand: inserted.rows[0],
                created: true
            });

        }
        catch (insertError) {

            // اگر همزمان ساخته شده باشد، همان رکورد را برمی‌گردانیم
            const again = await db.query(
                `
                SELECT id, name
                FROM car_brands
                WHERE LOWER(TRIM(name)) = LOWER($1)
                LIMIT 1
                `,
                [name]
            );

            if (again.rows.length) {
                return res.json({
                    brand: again.rows[0],
                    created: false
                });
            }

            throw insertError;

        }

    }
    catch (error) {

        console.log("CREATE BRAND ERROR:", error.message);

        return res.status(500).json({
            error: error.message
        });

    }

};


// ============================================================
// FIND OR CREATE MODEL
// POST /api/catalog/models   { name, brand | brand_id }
// ============================================================

exports.createModel = async (req, res) => {

    try {

        const { name, error: nameError } = cleanName(req.body?.name, "نام مدل", 80);

        if (nameError) {
            return res.status(400).json({ error: nameError });
        }

        const brandId = req.body?.brand_id || null;
        const brandName = String(req.body?.brand || "").trim();

        let brandRow = null;

        if (brandId) {

            const byId = await db.query(
                `
                SELECT id, name
                FROM car_brands
                WHERE id = $1
                `,
                [brandId]
            );

            brandRow = byId.rows[0] || null;

        }

        if (!brandRow && brandName) {

            const byName = await db.query(
                `
                SELECT id, name
                FROM car_brands
                WHERE LOWER(TRIM(name)) = LOWER($1)
                LIMIT 1
                `,
                [brandName]
            );

            brandRow = byName.rows[0] || null;

        }

        if (!brandRow) {
            return res.status(400).json({
                error:
                    "برند پیدا نشد؛ اول brand یا brand_id درست را بفرستید." +
                    (brandName ? " (brand: " + brandName + ")" : "")
            });
        }

        const existing = await db.query(
            `
            SELECT id, name, brand_id
            FROM car_models
            WHERE brand_id = $1
            AND LOWER(TRIM(name)) = LOWER($2)
            LIMIT 1
            `,
            [brandRow.id, name]
        );

        if (existing.rows.length) {
            return res.json({
                model: existing.rows[0],
                created: false
            });
        }

        try {

            const inserted = await db.query(
                `
                INSERT INTO car_models (name, brand_id)
                VALUES ($1, $2)
                RETURNING id, name, brand_id
                `,
                [name, brandRow.id]
            );

            return res.status(201).json({
                model: inserted.rows[0],
                created: true
            });

        }
        catch (insertError) {

            const again = await db.query(
                `
                SELECT id, name, brand_id
                FROM car_models
                WHERE brand_id = $1
                AND LOWER(TRIM(name)) = LOWER($2)
                LIMIT 1
                `,
                [brandRow.id, name]
            );

            if (again.rows.length) {
                return res.json({
                    model: again.rows[0],
                    created: false
                });
            }

            throw insertError;

        }

    }
    catch (error) {

        console.log("CREATE MODEL ERROR:", error.message);

        return res.status(500).json({
            error: error.message
        });

    }

};


// ============================================================
// ALL CATALOG IN ONE CALL
// GET /api/catalog/full
// ============================================================
// کمبوکس‌های فرم خودرو باید «همه‌چیز» را یک‌جا داشته باشند:
//  • همه برندهای car_brands به‌همراه مدل‌هایشان (دو کوئری، بدون N+1)
//  • برندها/مدل‌هایی که فقط در جدول cars ثبت شده‌اند و در کاتالوگ
//    نیستند، تا خودروی قبلی در لیست گم نشود و انتخابش ممکن بماند
//  • تعداد خودروهای هر برند، تا معلوم شود لیست از دیتابیس می‌آید
// خروجی: { brands:[{id,name,in_catalog,cars_count,models:[…]}], … }
// ============================================================

function foldName(value) {
    return String(value == null ? "" : value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

exports.getCatalogFull = async (req, res) => {

    try {

        const [brandsResult, modelsResult, carsResult] = await Promise.all([
            db.query(
                `
                SELECT id, name
                FROM car_brands
                ORDER BY name
                `
            ),
            db.query(
                `
                SELECT id, name, brand_id
                FROM car_models
                ORDER BY name
                `
            ),
            db.query(
                `
                SELECT brand, model, COUNT(*)::int AS cars_count
                FROM cars
                WHERE brand IS NOT NULL
                GROUP BY brand, model
                ORDER BY brand, model
                `
            ),
        ]);

        const brands = brandsResult.rows.map((brand) => ({
            id: brand.id,
            name: brand.name,
            in_catalog: true,
            cars_count: 0,
            models: modelsResult.rows
                .filter((model) => String(model.brand_id) === String(brand.id))
                .map((model) => ({
                    id: model.id,
                    name: model.name,
                    brand_id: model.brand_id,
                    brand_name: brand.name,
                    in_catalog: true,
                })),
        }));

        const brandIndex = new Map(brands.map((brand) => [foldName(brand.name), brand]));

        for (const row of carsResult.rows) {

            const brandKey = foldName(row.brand);
            const count = Number(row.cars_count) || 0;
            const modelKey = foldName(row.model);
            const known = brandIndex.get(brandKey);

            if (known) {

                known.cars_count += count;

                // مدلی که فقط در cars هست (کاتالوگ ندارد) هم قابل انتخاب بماند
                if (modelKey && !known.models.some((model) => foldName(model.name) === modelKey)) {

                    known.models.push({
                        id: null,
                        name: String(row.model).trim(),
                        brand_id: known.id,
                        brand_name: known.name,
                        in_catalog: false,
                    });
                }

                continue;
            }

            const fromCars = {
                id: null,
                name: String(row.brand).trim(),
                in_catalog: false,
                cars_count: 0,
                models: [],
            };

            brands.push(fromCars);
            brandIndex.set(brandKey, fromCars);

            if (modelKey) {

                fromCars.models.push({
                    id: null,
                    name: String(row.model).trim(),
                    brand_id: null,
                    brand_name: fromCars.name,
                    in_catalog: false,
                });
            }
        }

        brands.sort((a, b) => String(a.name).localeCompare(String(b.name)));

        const totalModels = brands.reduce((sum, brand) => sum + brand.models.length, 0);

        return res.json({
            brands,
            total_brands: brands.length,
            total_models: totalModels,
            generated_at: new Date().toISOString(),
        });

    } catch (error) {

        console.log("CATALOG FULL ERROR:", error.message);

        return res.status(500).json({
            error: error.message,
        });

    }

};
