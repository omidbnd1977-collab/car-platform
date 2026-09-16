const db = require("../config/database");

// ------------------------------------------------------------
// ایجاد جدول اگر وجود ندارد - اجرا در اولین درخواست
// ------------------------------------------------------------
let tableEnsured = false;

async function ensureTable() {
    if (tableEnsured) return;
    // جدول درخواست بازدید
    await db.query(`
        CREATE TABLE IF NOT EXISTS visit_requests (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(80) NOT NULL,
            last_name VARCHAR(80) NOT NULL,
            mobile VARCHAR(20) NOT NULL,
            car_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
            car_brand VARCHAR(120),
            car_model VARCHAR(120),
            car_year INTEGER,
            car_title VARCHAR(250),
            car_price_aed NUMERIC,
            status VARCHAR(30) NOT NULL DEFAULT 'جدید',
            sms_consent BOOLEAN NOT NULL DEFAULT FALSE,
            sms_consent_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ip_address VARCHAR(64)
        );
        CREATE INDEX IF NOT EXISTS idx_visit_requests_car_id ON visit_requests(car_id);
        CREATE INDEX IF NOT EXISTS idx_visit_requests_mobile ON visit_requests(mobile);
        CREATE INDEX IF NOT EXISTS idx_visit_requests_created_at ON visit_requests(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_visit_requests_status ON visit_requests(status);
    `);
    tableEnsured = true;
    console.log("VISIT_REQUESTS TABLE ensured");
}

// ------------------------------------------------------------
// نرمالایز و اعتبارسنجی موبایل ایرانی
// ------------------------------------------------------------
function normalizeMobile(input) {
    if (!input) return "";
    let s = String(input).trim().replace(/[\s\-\(\)]/g, "");
    // +98 -> 0
    if (s.startsWith("+98")) s = "0" + s.slice(3);
    if (s.startsWith("0098")) s = "0" + s.slice(4);
    if (s.startsWith("98") && s.length >= 12) s = "0" + s.slice(2);
    // 9xxxxxxxxx -> 09xxxxxxxxx
    if (/^9\d{9}$/.test(s)) s = "0" + s;
    return s;
}

function isValidIranMobile(mobile) {
    // بعد از نرمالایز باید 09xxxxxxxxx باشد
    return /^09\d{9}$/.test(mobile);
}

function validateName(name) {
    const t = String(name || "").trim();
    if (t.length < 2) return false;
    if (t.length > 80) return false;
    // حروف فارسی/انگلیسی + فاصله
    // اجازه می‌دهیم حداقل 2 کاراکتر حرف باشد
    return /^[\u0600-\u06FFa-zA-Z\s\-']{2,80}$/.test(t);
}

// ------------------------------------------------------------
// POST /api/visit-requests
// عمومی - ثبت درخواست بازدید
// ------------------------------------------------------------
exports.createVisitRequest = async (req, res) => {
    try {
        await ensureTable();

        const body = req.body || {};
        const first_name = String(body.first_name || body.firstName || "").trim();
        const last_name = String(body.last_name || body.lastName || "").trim();
        let mobile = normalizeMobile(body.mobile || body.phone || "");
        const car_id_raw = body.car_id || body.carId;
        const car_id = car_id_raw ? Number(car_id_raw) : null;
        const sms_consent = Boolean(body.sms_consent || body.smsConsent || false);

        // Validation فارسی
        if (!validateName(first_name)) {
            return res.status(400).json({ error: "نام نامعتبر است. حداقل ۲ حرف فارسی یا انگلیسی وارد کنید." });
        }
        if (!validateName(last_name)) {
            return res.status(400).json({ error: "نام خانوادگی نامعتبر است. حداقل ۲ حرف وارد کنید." });
        }
        if (!mobile || !isValidIranMobile(mobile)) {
            return res.status(400).json({ error: "شماره موبایل نامعتبر است. مثال: 09123456789" });
        }
        if (!car_id || !Number.isFinite(car_id) || car_id <= 0) {
            return res.status(400).json({ error: "خودروی مورد نظر مشخص نشده است." });
        }

        // بررسی وجود خودرو
        const carResult = await db.query(
            `SELECT id, brand, brand_id, model, model_id, year, price_aed,
                    COALESCE(car_brands.name, cars.brand) AS brand_name,
                    COALESCE(car_models.name, cars.model) AS model_name
             FROM cars
             LEFT JOIN car_brands ON cars.brand_id = car_brands.id
             LEFT JOIN car_models ON cars.model_id = car_models.id
             WHERE cars.id = $1 AND cars.status = 'ACTIVE' LIMIT 1`,
            [car_id]
        );

        if (!carResult.rows.length) {
            return res.status(404).json({ error: "خودروی مورد نظر یافت نشد یا فعال نیست." });
        }

        const car = carResult.rows[0];
        const car_brand = car.brand_name || car.brand || "";
        const car_model = car.model_name || car.model || "";
        const car_year = car.year || null;
        const car_price_aed = car.price_aed || null;
        const car_title = `${car_brand} ${car_model} ${car_year || ""}`.trim();

        // جلوگیری از ثبت تکراری سریع (همان موبایل + همان خودرو در 5 دقیقه اخیر)
        const dupCheck = await db.query(
            `SELECT id FROM visit_requests 
             WHERE mobile = $1 AND car_id = $2 AND created_at > NOW() - INTERVAL '5 minutes'
             LIMIT 1`,
            [mobile, car_id]
        );
        if (dupCheck.rows.length) {
            return res.status(429).json({ error: "درخواست شما برای همین خودرو همین الان ثبت شده است. لطفاً چند دقیقه بعد دوباره تلاش کنید." });
        }

        const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim().slice(0, 64);

        const result = await db.query(
            `INSERT INTO visit_requests
             (first_name, last_name, mobile, car_id, car_brand, car_model, car_year, car_title, car_price_aed, status, sms_consent, sms_consent_at, ip_address)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'جدید',$10, CASE WHEN $10 = true THEN NOW() ELSE NULL END, $11)
             RETURNING id, first_name, last_name, mobile, car_id, car_title, status, sms_consent, created_at`,
            [first_name, last_name, mobile, car_id, car_brand, car_model, car_year, car_title, car_price_aed, sms_consent, ip]
        );

        console.log(`VISIT REQUEST CREATED: #${result.rows[0].id} ${mobile} -> car ${car_id} ${car_title}`);

        return res.status(201).json({
            message: "درخواست شما با موفقیت ثبت شد",
            request: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE VISIT REQUEST ERROR:", error.message);
        return res.status(500).json({ error: "خطا در ثبت درخواست. لطفاً دوباره تلاش کنید." });
    }
};

// ------------------------------------------------------------
// GET /api/visit-requests
// ادمین - لیست درخواست‌ها
// ------------------------------------------------------------
const ALLOWED_STATUSES = ["جدید", "در حال پیگیری", "تماس گرفته شد", "بازدید انجام شد", "بسته شد"];

exports.getVisitRequests = async (req, res) => {
    try {
        await ensureTable();

        const { status, search, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT 
                vr.*,
                c.brand AS car_brand_raw,
                c.model AS car_model_raw
            FROM visit_requests vr
            LEFT JOIN cars c ON vr.car_id = c.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (status && ALLOWED_STATUSES.includes(status)) {
            query += ` AND vr.status = $${idx}`;
            values.push(status);
            idx++;
        }

        if (search) {
            const s = `%${String(search).trim()}%`;
            query += ` AND (vr.first_name ILIKE $${idx} OR vr.last_name ILIKE $${idx} OR vr.mobile ILIKE $${idx} OR vr.car_title ILIKE $${idx})`;
            values.push(s);
            idx++;
        }

        query += ` ORDER BY vr.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        values.push(Math.min(Number(limit) || 100, 200));
        values.push(Math.max(Number(offset) || 0, 0));

        const result = await db.query(query, values);

        const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM visit_requests`);
        const statsResult = await db.query(`
            SELECT status, COUNT(*)::int AS count FROM visit_requests GROUP BY status
        `);

        return res.json({
            requests: result.rows,
            total: countResult.rows[0].total,
            stats: statsResult.rows
        });

    } catch (error) {
        console.error("GET VISIT REQUESTS ERROR:", error.message);
        return res.status(500).json({ error: error.message });
    }
};

// ------------------------------------------------------------
// PATCH /api/visit-requests/:id/status
// ادمین - تغییر وضعیت
// ------------------------------------------------------------
exports.updateVisitRequestStatus = async (req, res) => {
    try {
        await ensureTable();

        const id = Number(req.params.id);
        const { status } = req.body || {};

        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({ error: "شناسه نامعتبر است." });
        }
        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ error: `وضعیت نامعتبر است. مجاز: ${ALLOWED_STATUSES.join(" / ")}` });
        }

        const result = await db.query(
            `UPDATE visit_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: "درخواست یافت نشد." });
        }

        return res.json({
            message: "وضعیت بروزرسانی شد",
            request: result.rows[0]
        });

    } catch (error) {
        console.error("UPDATE VISIT REQUEST STATUS ERROR:", error.message);
        return res.status(500).json({ error: error.message });
    }
};

// ------------------------------------------------------------
// GET /api/visit-requests/:id
// ادمین - جزئیات یک درخواست
// ------------------------------------------------------------
exports.getVisitRequestById = async (req, res) => {
    try {
        await ensureTable();
        const id = Number(req.params.id);
        const result = await db.query(`SELECT * FROM visit_requests WHERE id = $1`, [id]);
        if (!result.rows.length) {
            return res.status(404).json({ error: "درخواست یافت نشد." });
        }
        return res.json({ request: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// برای اطمینان: اگر سرور مستقیم خواست جدول را بسازد
exports.ensureTable = ensureTable;
exports.ALLOWED_STATUSES = ALLOWED_STATUSES;
