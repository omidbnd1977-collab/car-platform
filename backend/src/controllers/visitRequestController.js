const db = require("../config/database");
const smsService = require("../services/smsService");

let tableEnsured = false;

async function ensureTable() {
    if (tableEnsured) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS visit_requests (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(80) NOT NULL,
                last_name VARCHAR(80) NOT NULL,
                mobile VARCHAR(20) NOT NULL,
                car_id INTEGER,
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
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_car_id ON visit_requests(car_id);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_mobile ON visit_requests(mobile);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_created_at ON visit_requests(created_at DESC);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_visit_requests_status ON visit_requests(status);`);

        try {
            await db.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'fk_visit_requests_car_id'
                    ) THEN
                        ALTER TABLE visit_requests
                        ADD CONSTRAINT fk_visit_requests_car_id
                        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
                    END IF;
                END $$;
            `);
        } catch (fkErr) {
            console.log("FK not added:", fkErr.message);
        }

        tableEnsured = true;
        console.log("VISIT_REQUESTS TABLE ensured");
    } catch (e) {
        console.error("ENSURE TABLE ERROR:", e.message, e.stack);
        throw e;
    }
}

function normalizeMobile(input) {
    if (!input) return "";
    let s = String(input).trim().replace(/[\s\-\(\)]/g, "");
    if (s.startsWith("+98")) s = "0" + s.slice(3);
    if (s.startsWith("0098")) s = "0" + s.slice(4);
    if (s.startsWith("98") && s.length >= 12) s = "0" + s.slice(2);
    if (/^9\d{9}$/.test(s)) s = "0" + s;
    return s;
}

function isValidIranMobile(mobile) {
    return /^09\d{9}$/.test(mobile);
}

function validateName(name) {
    const t = String(name || "").trim();
    if (t.length < 2) return false;
    if (t.length > 80) return false;
    return /^[\u0600-\u06FFa-zA-Z\s\-']{2,80}$/.test(t);
}

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

        // بررسی خودرو - ساده و مقاوم
        let car = null;
        try {
            const simpleCar = await db.query(
                `SELECT id, brand, model, year, price_aed, status, brand_id, model_id FROM cars WHERE id = $1 LIMIT 1`,
                [car_id]
            );
            if (simpleCar.rows.length) {
                const c = simpleCar.rows[0];
                if (String(c.status).toUpperCase() !== 'ACTIVE') {
                    return res.status(404).json({ error: "خودروی مورد نظر فعال نیست." });
                }
                let brandName = c.brand || "";
                let modelName = c.model || "";
                try {
                    if (c.brand_id) {
                        const b = await db.query(`SELECT name FROM car_brands WHERE id = $1 LIMIT 1`, [c.brand_id]);
                        if (b.rows.length) brandName = b.rows[0].name || brandName;
                    }
                    if (c.model_id) {
                        const m = await db.query(`SELECT name FROM car_models WHERE id = $1 LIMIT 1`, [c.model_id]);
                        if (m.rows.length) modelName = m.rows[0].name || modelName;
                    }
                } catch (e) {
                    console.log("BRAND/MODEL lookup failed, using raw:", e.message);
                }
                car = {
                    id: c.id,
                    brand_name: brandName,
                    model_name: modelName,
                    brand: c.brand,
                    model: c.model,
                    year: c.year,
                    price_aed: c.price_aed
                };
            }
        } catch (carErr) {
            console.error("CAR FETCH ERROR:", carErr.message, carErr.stack);
            return res.status(500).json({ error: "خطا در بررسی خودرو: " + carErr.message });
        }

        if (!car) {
            return res.status(404).json({ error: "خودروی مورد نظر یافت نشد (id: " + car_id + ")." });
        }

        const car_brand = String(car.brand_name || car.brand || "").trim().slice(0, 120);
        const car_model = String(car.model_name || car.model || "").trim().slice(0, 120);
        let car_year = null;
        try {
            const y = Number(car.year);
            if (Number.isFinite(y) && y > 1900 && y < 2100) car_year = Math.trunc(y);
        } catch {}
        let car_price_aed = null;
        try {
            const p = Number(car.price_aed);
            if (Number.isFinite(p) && p >= 0) car_price_aed = p;
        } catch {}
        const car_title = `${car_brand} ${car_model} ${car_year || ""}`.trim().slice(0, 250);

        try {
            const dupCheck = await db.query(
                `SELECT id FROM visit_requests 
                 WHERE mobile = $1 AND car_id = $2 AND created_at > NOW() - INTERVAL '5 minutes'
                 LIMIT 1`,
                [mobile, car_id]
            );
            if (dupCheck.rows.length) {
                return res.status(429).json({ error: "درخواست شما برای همین خودرو همین الان ثبت شده است. لطفاً چند دقیقه بعد دوباره تلاش کنید." });
            }
        } catch (dupErr) {
            console.log("DUP CHECK failed (ignoring):", dupErr.message);
        }

        const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim().slice(0, 64);

        let result;
        try {
            result = await db.query(
                `INSERT INTO visit_requests
                 (first_name, last_name, mobile, car_id, car_brand, car_model, car_year, car_title, car_price_aed, status, sms_consent, sms_consent_at, ip_address)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'جدید',$10, CASE WHEN $10 = true THEN NOW() ELSE NULL END, $11)
                 RETURNING id, first_name, last_name, mobile, car_id, car_title, status, sms_consent, created_at`,
                [first_name, last_name, mobile, car_id, car_brand, car_model, car_year, car_title, car_price_aed, sms_consent, ip]
            );
        } catch (insErr) {
            console.error("INSERT VISIT_REQUEST ERROR:", insErr.message, insErr.stack);
            return res.status(500).json({ error: "خطا در ذخیره درخواست: " + insErr.message + " | کد: " + (insErr.code || "") });
        }

        console.log(`VISIT REQUEST CREATED: #${result.rows[0].id} ${mobile} -> car ${car_id} ${car_title}`);

        // ارسال پیامک کاوه‌نگار به مدیر + تایید به مشتری (غیرمسدودکننده)
        setImmediate(async () => {
            try {
                const smsConf = smsService.getConfig();
                console.log("SMS CONFIG CHECK:", { enabled: smsConf.enabled, template: smsConf.template, adminTemplate: smsConf.adminTemplate, adminCount: smsConf.adminMobiles.length, hasSender: Boolean(smsConf.sender) });
                if (smsConf.enabled) {
                    console.log("SMS: attempting admin notification to", smsConf.adminMobiles.join(","), "car:", car_title);
                    const adminRes = await smsService.notifyAdminNewRequest({
                        firstName: first_name,
                        lastName: last_name,
                        mobile,
                        carTitle: car_title,
                        carId: car_id
                    });
                    console.log("SMS ADMIN RESULT:", JSON.stringify(adminRes).slice(0, 1000));
                    const custRes = await smsService.sendCustomerConfirmation({
                        mobile,
                        firstName: first_name,
                        carTitle: car_title
                    });
                    console.log("SMS CUSTOMER RESULT:", JSON.stringify(custRes).slice(0, 500));
                } else {
                    console.log("SMS: disabled (KAVENEGAR_API_KEY not set)");
                }
            } catch (smsErr) {
                console.error("SMS background error (non-critical):", smsErr.message, smsErr.stack ? smsErr.stack.slice(0, 800) : "");
            }
        });

        return res.status(201).json({
            message: "درخواست شما با موفقیت ثبت شد",
            request: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE VISIT REQUEST ERROR (outer):", error.message, error.stack);
        return res.status(500).json({ error: "خطا در ثبت درخواست: " + String(error.message || "") });
    }
};

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
        const statsResult = await db.query(`SELECT status, COUNT(*)::int AS count FROM visit_requests GROUP BY status`);
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

// خروجی CSV برای پیامک گروهی - فقط شماره‌هایی که رضایت داده‌اند
exports.exportVisitRequestsCsv = async (req, res) => {
    try {
        await ensureTable();
        const { consent } = req.query; // consent=true فقط رضایت‌دارها
        let where = "";
        const values = [];
        if (String(consent).toLowerCase() === "true" || consent === "1") {
            where = "WHERE sms_consent = true";
        }
        // شماره‌های یکتا
        const result = await db.query(
            `SELECT DISTINCT ON (mobile) mobile, first_name, last_name, car_title, sms_consent, created_at
             FROM visit_requests ${where}
             ORDER BY mobile, created_at DESC`,
            values
        );

        const rows = result.rows;
        // CSV header
        const header = "mobile,first_name,last_name,car_title,sms_consent,created_at\n";
        const lines = rows.map((r) => {
            const esc = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
            return `${r.mobile},${esc(r.first_name)},${esc(r.last_name)},${esc(r.car_title)},${r.sms_consent ? "yes" : "no"},${r.created_at ? new Date(r.created_at).toISOString() : ""}`;
        });
        const csv = header + lines.join("\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=visit-requests-${consent === "true" ? "consent-" : ""}${new Date().toISOString().slice(0,10)}.csv`);
        return res.status(200).send("\uFEFF" + csv); // BOM for Excel Persian
    } catch (e) {
        console.error("EXPORT CSV ERROR:", e.message);
        return res.status(500).json({ error: e.message });
    }
};

// ارسال گروهی از طریق کاوه‌نگار - فقط ادمین
exports.bulkSmsToConsented = async (req, res) => {
    try {
        await ensureTable();
        const { message, template, dryRun, mobiles: selectedMobiles } = req.body || {};
        const smsService = require("../services/smsService");
        const conf = smsService.getConfig();
        if (!conf.enabled) return res.status(400).json({ error: "KAVENEGAR_API_KEY نیست" });

        const sanitize = (s) => String(s || "").trim().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF\-.,!?:;()]/g, "").slice(0, 60) || "x";
        const sanitizeName = (s) => String(s || "").trim().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF\-]/g, "").slice(0, 30) || "کاربر";

        let rows = [];
        if (Array.isArray(selectedMobiles) && selectedMobiles.length > 0) {
            const cleaned = selectedMobiles.map((m) => String(m).trim()).filter((m) => /^09\d{9}$/.test(m));
            if (cleaned.length === 0) return res.status(400).json({ error: "شماره معتبر انتخاب نشده" });
            const q = await db.query(`SELECT DISTINCT ON (mobile) mobile, first_name, last_name FROM visit_requests WHERE mobile = ANY($1) ORDER BY mobile, created_at DESC`, [cleaned]);
            rows = q.rows;
            const foundMobiles = new Set(rows.map((r) => r.mobile));
            for (const m of cleaned) {
                if (!foundMobiles.has(m)) rows.push({ mobile: m, first_name: "کاربر", last_name: "" });
            }
        } else {
            const q = await db.query(`SELECT DISTINCT ON (mobile) mobile, first_name, last_name FROM visit_requests WHERE sms_consent = true ORDER BY mobile, created_at DESC`);
            rows = q.rows;
        }

        const mobiles = rows.map((r) => r.mobile).filter(Boolean);
        if (mobiles.length === 0) return res.json({ ok: true, total: 0, message: "هیچ شماره‌ای نیست" });
        if (dryRun) return res.json({ ok: true, dryRun: true, total: mobiles.length, sample: mobiles.slice(0,5) });

        if (!message && !template) return res.status(400).json({ error: "متن پیامک را وارد کنید" });

        // الگوی گروهی: اگر bulk-greeting داری، از آن استفاده کن: "آقای %token% عزیز %token2%"
        // وگرنه از template داده شده یا admin-notify یا verify
        let bulkTemplate = template || process.env.KAVENEGAR_BULK_TEMPLATE || "bulk-greeting";
        // چک کن آیا bulk-greeting وجود دارد، اگر نه fallback
        const tryTemplates = [bulkTemplate, "bulk-greeting", "admin-notify", "verify", conf.template].filter(Boolean);
        // حذف تکراری
        const uniqTemplates = [...new Set(tryTemplates)];

        const results = [];
        for (const row of rows) {
            const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "کاربر";
            const fullNameSafe = sanitizeName(fullName);
            const msgSafe = sanitize(message || "");

            let sent = false;
            let lastErr = "";
            for (const tmpl of uniqTemplates) {
                try {
                    let r;
                    if (conf.sender) {
                        // اگر sender داری، متن کامل فارسی
                        const fullText = `آقای ${fullName} عزیز ${message}`;
                        r = await smsService.sendViaKavenegar({ receptor: row.mobile, message: fullText });
                    } else {
                        if (tmpl === "bulk-greeting") {
                            // الگوی پیشنهادی: آقای %token% عزیز %token2%
                            r = await smsService.lookupViaKavenegar({ receptor: row.mobile, template: tmpl, token: fullNameSafe, token2: msgSafe });
                        } else if (tmpl === "admin-notify") {
                            r = await smsService.lookupViaKavenegar({ receptor: row.mobile, template: tmpl, token: fullNameSafe, token2: row.mobile, token3: msgSafe });
                        } else if (tmpl === "verify") {
                            r = await smsService.lookupViaKavenegar({ receptor: row.mobile, template: tmpl, token: msgSafe });
                        } else {
                            r = await smsService.lookupViaKavenegar({ receptor: row.mobile, template: tmpl, token: fullNameSafe, token2: msgSafe });
                        }
                    }
                    results.push({ mobile: row.mobile, ok: true, method: r.method || "lookup", template: tmpl });
                    sent = true;
                    break;
                } catch (e) {
                    lastErr = e.message;
                    // اگر template پیدا نشد، بعدی را امتحان کن
                    if (e.message.includes("424") || e.message.includes("پیدا نشد")) continue;
                    else break; // خطای دیگه (مثل 431) را نگه دار
                }
            }
            if (!sent) {
                results.push({ mobile: row.mobile, ok: false, error: lastErr });
            }
            await new Promise((res) => setTimeout(res, 600));
        }
        return res.json({ ok: true, total: mobiles.length, sent: results.filter((r)=>r.ok).length, failed: results.filter((r)=>!r.ok).length, results, usedTemplate: uniqTemplates[0], hasSender: Boolean(conf.sender), hint: "برای متن 'آقای نام عزیز ...' الگوی bulk-greeting بساز: آقای %token% عزیز %token2%" });
    } catch (e) {
        console.error("BULK SMS ERROR:", e.message, e.stack);
        return res.status(500).json({ error: e.message });
    }
};

exports.ensureTable = ensureTable;
exports.ALLOWED_STATUSES = ALLOWED_STATUSES;
