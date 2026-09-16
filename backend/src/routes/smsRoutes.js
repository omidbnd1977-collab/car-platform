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
        // لاگ امن - بدون لو دادن کل هدر
        const safeBody = req.body || {};
        console.log("Body keys:", Object.keys(safeBody));
        console.log("Body:", JSON.stringify(safeBody).slice(0, 2000));
        console.log("Query:", JSON.stringify(req.query || {}).slice(0, 1000));
        console.log("===================================");

        const body = req.body || {};
        const messageId = body.messageid || body.MessageID || body.messageId || body.message_id || "";
        const status = body.status || body.Status || "";
        const receptor = body.receptor || body.Receptor || "";

        return res.status(200).json({
            ok: true,
            received: true,
            messageId,
            status,
            receptor,
            at: new Date().toISOString()
        });
    } catch (e) {
        console.error("SMS WEBHOOK ERROR:", e.message, e.stack);
        // حتی در خطا 200 بده تا کاوه‌نگار retry بی‌نهایت نکند
        return res.status(200).json({ ok: true, received: true, error: e.message });
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
