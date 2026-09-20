const express = require("express");
const adminGuard = require("../middleware/adminGuard");
const { smsLimiter } = require("../middleware/rateLimit");
const router = express.Router();

// helper برای ساخت URL داینامیک - بدون hard-code دامنه
function getBaseUrl(req) {
    // اولویت: ENV های عمومی
    const envUrl = String(process.env.PUBLIC_API_URL || process.env.BASE_URL || process.env.API_URL || "").trim();
    if (envUrl) {
        return envUrl.replace(/\/+$/, "");
    }
    // از خود request بساز - multi-tenant friendly
    try {
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host = req.get("host") || req.headers.host || "";
        if (host) {
            return `${protocol}://${host}/api`.replace(/\/+$/, "");
        }
    } catch {}
    // fallback - دیگر hard-code car-platform-db نیست
    return "/api";
}

// ------------------------------------------------------------
// وب‌هوک کاوه‌نگار - دریافت وضعیت ارسال پیامک
// ------------------------------------------------------------
// تو پنل کاوه‌نگار -> تنظیمات -> وب‌هوک
// آدرس را بگذار: {BASE_URL}/sms/webhook (داینامیک)
// متد: POST
// ------------------------------------------------------------

router.post("/webhook", (req, res) => {
    try {
        console.log("=== KAVENEGAR WEBHOOK RECEIVED ===");
        console.log("Time:", new Date().toISOString());
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
        return res.status(200).json({ ok: true, received: true, error: e.message });
    }
});

// تست وب‌هوک - GET برای اینکه ببینی کار می‌کند
router.get("/webhook", (req, res) => {
    const baseUrl = getBaseUrl(req);
    return res.json({
        ok: true,
        message: `Kavenegar webhook endpoint is active. Use POST ${baseUrl}/sms/webhook`,
        usage: {
            method: "POST",
            url: `${baseUrl}/sms/webhook`,
            kavenegar_panel: "تنظیمات -> وب‌هوک -> همین آدرس را بگذار",
            note: "این URL داینامیک است - بر اساس دامنه فعلی ساخته می‌شود. برای hard-code می‌توانی PUBLIC_API_URL را در ENV ست کنی."
        }
    });
});

// تست ارسال پیامک به مدیر - GET /api/sms/test
router.get("/test", adminGuard, smsLimiter, async (req, res) => {
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

        let lookupError = null;
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
            } catch (e) {
                lookupError = e.message;
                console.error("Lookup test failed:", e.message);
            }
        }

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
                config: conf,
                lookupError
            });
        } catch (sendErr) {
            const errMsg = String(sendErr.message || "");
            let help = "";
            if (errMsg.includes("412") || errMsg.includes("ارسال کننده نامعتبر")) {
                help = "فرستنده نامعتبر است. یا SMS_SENDER را از پنل کاوه‌نگار دقیق کپی کن، یا SMS_SENDER را حذف کن و KAVENEGAR_TEMPLATE را ست کن.";
            }
            return res.status(500).json({
                ok: false,
                error: errMsg,
                lookupError,
                help,
                config: conf,
                suggestion: "اگر template ست کردی ولی lookupError داری، الگو باید 'تایید شده' باشد."
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

// تست مستقیم درخواست بازدید
router.post("/test-visit", adminGuard, smsLimiter, async (req, res) => {
    try {
        const smsService = require("../services/smsService");
        const conf = smsService.getConfig();
        const { firstName, lastName, mobile, carTitle } = req.body || {};

        if (!conf.enabled) return res.status(400).json({ error: "KAVENEGAR_API_KEY نیست", config: conf });
        if (!conf.template && !conf.adminTemplate) return res.status(400).json({ error: "KAVENEGAR_TEMPLATE نیست", config: conf });

        const fn = String(firstName || "تست").trim();
        const ln = String(lastName || "کاربر").trim();
        const mo = String(mobile || conf.adminMobiles[0] || "").trim();
        const ct = String(carTitle || "تویوتا کمری 2023").trim();

        console.log("TEST-VISIT SMS:", { fn, ln, mo, ct, template: conf.template });

        const result = await smsService.notifyAdminNewRequest({
            firstName: fn,
            lastName: ln,
            mobile: mo,
            carTitle: ct,
            carId: 999
        });

        return res.json({ ok: true, config: conf, result, input: { fn, ln, mo, ct } });
    } catch (e) {
        console.error("TEST-VISIT ERROR:", e.message, e.stack);
        return res.status(500).json({ ok: false, error: e.message, stack: e.stack ? e.stack.slice(0, 1000) : "" });
    }
});

// وضعیت سرویس پیامک
router.get("/status", adminGuard, (req, res) => {
    try {
        const smsService = require("../services/smsService");
        const conf = smsService.getConfig();
        const baseUrl = getBaseUrl(req);
        return res.json({
            enabled: conf.enabled,
            hasApiKey: Boolean(conf.apiKey),
            hasSender: Boolean(conf.sender),
            adminCount: conf.adminMobiles.length,
            template: conf.template || null,
            adminTemplate: conf.adminTemplate || null,
            provider: "kavenegar",
            webhook: `${baseUrl}/sms/webhook`,
            testUrl: `${baseUrl}/sms/test`,
            testVisitUrl: `${baseUrl}/sms/test-visit`,
            baseUrlSource: process.env.PUBLIC_API_URL ? "env:PUBLIC_API_URL" : process.env.BASE_URL ? "env:BASE_URL" : "dynamic:request"
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

module.exports = router;
