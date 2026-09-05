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
const multer = require("multer");
const app = express();
app.use(cors());
app.use(express.json());
app.use(
    "/uploads",
    express.static("uploads")
);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dealerships", dealershipRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/purchases", purchaseRoutes);
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
        return res.status(400).json({
            error: err.message
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
app.listen(PORT,()=>{
    console.log(
        `Server running on port ${PORT}`
    );
});
