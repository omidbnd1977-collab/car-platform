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

// تست ارسال پیامک به مدیر - GET /api/sms/test
// برای اینکه بفهمی چرا پیامک نمی‌رود
router.get("/test", async (req, res) => {
    try {
        const smsService = require("../services/smsService");
        const conf = smsService.getConfig();

        if (!conf.enabled) {
            return res.status(400).json({ error: "KAVENEGAR_API_KEY تنظیم نشده", config: conf });
        }
        if (conf.adminMobiles.length === 0) {
            return res.status(400).json({ error: "ADMIN_MOBILE تنظیم نشده", config: conf });
        }

        const testMobile = conf.adminMobiles[0];
        const template = conf.template || conf.adminTemplate;

        console.log(`SMS TEST: sending to ${testMobile} template=${template || 'none'} sender=${conf.sender || 'none'}`);

        // اگر پترن داری، اول Lookup را امتحان کن (نیازی به sender ندارد)
        if (template) {
            try {
                const r = await smsService.lookupViaKavenegar({
                    receptor: testMobile,
                    template,
                    token: "تست",
                    token2: testMobile,
                    token3: "تویوتا"
                });
                return res.json({
                    ok: true,
                    method: "lookup",
                    sentTo: testMobile,
                    template,
                    result: r,
                    config: conf
                });
            } catch (lookupErr) {
                console.error("Lookup test failed, trying Send:", lookupErr.message);
                // ادامه به Send
            }
        }

        // Send معمولی
        try {
            const message = `تست پیامک از سایت ${new Date().toLocaleString("fa-IR")}`;
            const result = await smsService.sendViaKavenegar({
                receptor: testMobile,
                message
            });
            return res.json({
                ok: true,
                method: "send",
                sentTo: testMobile,
                result,
                config: conf
            });
        } catch (sendErr) {
            // خطای 412 sender invalid -> راهنمایی دقیق
            const errMsg = String(sendErr.message || "");
            let help = "";
            if (errMsg.includes("412") || errMsg.includes("ارسال کننده نامعتبر")) {
                help = "فرستنده نامعتبر است. یا SMS_SENDER را از پنل کاوه‌نگار (شماره‌های من) دقیق کپی کن، یا SMS_SENDER را حذف کن و یک الگو (Lookup) بساز و KAVENEGAR_TEMPLATE را ست کن. بدون فرستنده معتبر، متد Send کار نمی‌کند.";
            }
            return res.status(500).json({
                ok: false,
                error: errMsg,
                help,
                config: conf,
                suggestion: "پنل کاوه‌نگار -> شماره‌ها -> شماره دقیق را کپی کن به SMS_SENDER، یا پنل -> الگوها -> الگوی جدید admin-notify بساز و KAVENEGAR_TEMPLATE=admin-notify ست کن"
            });
        }

    } catch (e) {
        console.error("SMS TEST ERROR:", e.message, e.stack);
        return res.status(500).json({
            ok: false,
            error: e.message,
            stack: e.stack ? e.stack.slice(0, 1000) : ""
        });
    }
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
            webhook: "https://car-platform-db.onrender.com/api/sms/webhook",
            testUrl: "https://car-platform-db.onrender.com/api/sms/test"
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

module.exports = router;
