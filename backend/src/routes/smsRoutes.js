const express = require("express");
const router = express.Router();

// ------------------------------------------------------------
// وب‌هوک کاوه‌نگار - دریافت وضعیت ارسال پیامک
// ------------------------------------------------------------
// تو پنل کاوه‌نگار -> تنظیمات -> وب‌هوک
// آدرس را بگذار:
//   https://car-platform-db.onrender.com/api/sms/webhook
// متد: POST
// ------------------------------------------------------------

router.post("/webhook", (req, res) => {
    try {
        console.log("=== KAVENEGAR WEBHOOK RECEIVED ===");
        console.log("Time:", new Date().toISOString());
        console.log("Headers:", JSON.stringify(req.headers).slice(0, 1000));
        console.log("Body:", JSON.stringify(req.body || {}).slice(0, 2000));
        console.log("Query:", JSON.stringify(req.query || {}).slice(0, 1000));
        console.log("===================================");

        // کاوه‌نگار معمولاً این فیلدها را می‌فرستد:
        // messageid, status, statustext, sender, receptor, date, cost
        const body = req.body || {};
        const messageId = body.messageid || body.MessageID || body.messageId || "";
        const status = body.status || body.Status || "";
        const receptor = body.receptor || body.Receptor || "";

        // اینجا می‌تونی وضعیت را در دیتابیس ذخیره کنی اگر خواستی
        // مثلاً آپدیت جدول sms_logs

        // باید 200 برگردانی تا کاوه‌نگار بفهمد دریافت شد
        return res.status(200).json({
            ok: true,
            received: true,
            messageId,
            status,
            receptor,
            at: new Date().toISOString()
        });
    } catch (e) {
        console.error("SMS WEBHOOK ERROR:", e.message);
        return res.status(200).json({ ok: true, error: e.message }); // حتی در خطا 200 بده تا کاوه‌نگار retry نکند
    }
});

// تست وب‌هوک - GET برای اینکه ببینی کار می‌کند
router.get("/webhook", (req, res) => {
    return res.json({
        ok: true,
        message: "Kavenegar webhook endpoint is active. Use POST https://car-platform-db.onrender.com/api/sms/webhook",
        usage: {
            method: "POST",
            url: "https://car-platform-db.onrender.com/api/sms/webhook",
            kavenegar_panel: "تنظیمات -> وب‌هوک -> همین آدرس را بگذار"
        }
    });
});

// وضعیت سرویس پیامک
router.get("/status", (req, res) => {
    try {
        const smsService = require("../services/smsService");
        const conf = smsService.getConfig();
        return res.json({
            enabled: conf.enabled,
            hasApiKey: Boolean(conf.apiKey),
            hasSender: Boolean(conf.sender),
            adminCount: conf.adminMobiles.length,
            template: conf.template || null,
            adminTemplate: conf.adminTemplate || null,
            provider: "kavenegar",
            webhook: "https://car-platform-db.onrender.com/api/sms/webhook"
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

module.exports = router;
