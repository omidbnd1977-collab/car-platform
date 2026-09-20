const catalogRoutes = require("./routes/catalogRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const dealershipRoutes = require("./routes/dealershipRoutes");
const carRoutes = require("./routes/carRoutes");
const imageRoutes = require("./routes/imageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const visitRequestRoutes = require("./routes/visitRequestRoutes");
const smsRoutes = require("./routes/smsRoutes");
const multer = require("multer");
const { globalLimiter } = require("./middleware/rateLimit");
const { MAX_FILE_SIZE_MB } = require("./middleware/upload");
const storageService = require("./services/storageService");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ------------------------------------------------------------
// اگر بدنه‌ی JSON خوانده نشود (مثلاً درخواست بدون Content-Type
// application/json) اکسپرس req.body را تعریف نمی‌کند و کنترلرها روی
// `= req.body` می‌شکنند: «Cannot destructure property ... of 'req.body'
// as it is undefined». این میدل‌ور یک {} خالی می‌گذارد تا کنترلر خودشان
// با پیام فارسیِ «فیلد لازم است» جواب بدهند، نه ۵۰۰.
// ------------------------------------------------------------
app.use((req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
        req.body = {};
    }

    next();
});
// ============================================================
//  سرو فایل‌های آپلودی
// ============================================================
// ریشه و پیشوند /uploads از storageService گرفته می‌شود تا
// مسیر دیسک فقط یک‌جا تعریف شود. در حالت
// STORAGE_PROVIDER=s3|r2 فایل‌های جدید روی دامنه‌ی استورج
// ذخیره و سرو می‌شوند و این میدل‌ور فقط به فایل‌های قدیمی
// (legacy) روی دیسک پاسخ می‌دهد تا بعد از سوییچ کردن هم
// تا زمان مایگرشن نشکنند.
// ============================================================
// لاگ شروع: روی Render (Log tab) فوراً مشخص می‌کند عکس‌ها
// کجا ذخیره می‌شوند و اگر پیکربندی S3/R2 ناقص است همان‌جا
// دیده شود، نه بعد از اولین آپلود ناموفق.
const storageSummary = storageService.describe();
console.log("STORAGE:", JSON.stringify(storageSummary));

if (storageSummary.error) {
    console.warn("STORAGE MISCONFIGURED:", storageSummary.error);
}

// در حالت محلی پوشه‌ی uploads را از قبل می‌سازیم تا اولین
// آپلود به خاطر نبودِ پوشه شکست نخورد.
if (storageService.servesLocalFiles()) {
    storageService.ensureLocalDirs();
}

app.use(
    storageService.getUrlPrefix(),
    express.static(storageService.getLocalUploadsDir(), {
        maxAge: "1d",
        fallthrough: true,
    })
);
// Rate limit سراسری - جلوگیری از سیل درخواست
app.use("/api", globalLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dealerships", dealershipRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/visit-requests", visitRequestRoutes);
app.use("/api/sms", smsRoutes);
app.use(
"/api/catalog",
catalogRoutes
);
// Test
app.get("/", (req, res) => {
    res.json({
        message: "Car Platform API is running"
    });
});
app.get("/test-db", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT NOW()"
        );
        res.json({
            status:"database connected",
            time:result.rows[0]
        });
    } catch(error){
        res.status(500).json({
            error:error.message
        });
    }
});

// =================================================
// 404 - ROUTE NOT FOUND
// =================================================
// اگر هیچ روتی مچ نشد، به‌جای صفحه‌ی HTML پیش‌فرض
// اکسپرس، یک پاسخ JSON برمی‌گردانیم.
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found"
    });
});

// =================================================
// GLOBAL ERROR HANDLER
// =================================================
// این میدل‌ور همیشه باید آخرین چیزی باشد که با app.use
// اضافه می‌شود. هر خطایی که در روت‌ها یا میدل‌ورهایی
// مثل multer (آپلود فایل) رخ بدهد و catch نشده باشد،
// اینجا گرفته می‌شود تا به‌جای صفحه‌ی خطای HTML پیش‌فرض
// اکسپرس، همیشه یک پاسخ JSON برگردد. بدون این میدل‌ور،
// فرانت‌اند هنگام پارس کردن پاسخ با خطای
// "Unexpected token '<' is not valid JSON" مواجه می‌شود.
app.use((err, req, res, next) => {
    console.log("UNHANDLED ERROR:", err);

    // خطاهای مخصوص multer (حجم فایل، فرمت غیرمجاز و...)
    if (err instanceof multer.MulterError) {
        // LIMIT_FILE_SIZE را با ۴۱۳ برمی‌گردانیم تا فرانت‌اند
        // بتواند «حجم فایل بیش از حد مجاز است» را نشان دهد.
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                error:
                    "File too large. Maximum size is " +
                    MAX_FILE_SIZE_MB +
                    " MB.",
                code: err.code,
            });
        }

        return res.status(400).json({
            error: err.message,
            code: err.code,
        });
    }

    // خطاهای دیگر (مثلاً fileFilter یا مشکل پوشه‌ی مقصد)
    if (err) {
        return res.status(500).json({
            error: err.message || "Internal server error"
        });
    }

    next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,async ()=>{
    console.log(
        `Server running on port ${PORT}`
    );
    // اجرای مایگریشن‌ها در startup - جایگزین CREATE TABLE IF NOT EXISTS پراکنده
    try {
        const { runMigrations } = require("./config/migrate");
        await runMigrations();
        console.log("MIGRATIONS ensured on startup");
    } catch (e) {
        console.error("MIGRATIONS startup failed:", e.message);
    }
    // وضعیت پیامک کاوه‌نگار
    try {
        const smsService = require("./services/smsService");
        const smsConf = smsService.getConfig();
        console.log("SMS CONFIG:", JSON.stringify({
            enabled: smsConf.enabled,
            hasSender: Boolean(smsConf.sender),
            adminCount: smsConf.adminMobiles.length,
            adminMasked: smsConf.adminMobiles.map(m => m.slice(0,4)+"***"+m.slice(-2))
        }));
        if (!smsConf.enabled) {
            console.log("SMS: خاموش - KAVENEGAR_API_KEY تنظیم نشده. برای فعال‌سازی در Render ست کنید.");
        }
    } catch (e) {
        console.log("SMS config check failed:", e.message);
    }
});
