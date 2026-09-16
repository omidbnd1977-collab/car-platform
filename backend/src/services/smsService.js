const axios = require("axios");

// ------------------------------------------------------------
// سرویس پیامک کاوه‌نگار - Kavenegar
// پشتیبانی از دو متد: Send و Lookup (پترن)
// ------------------------------------------------------------
// ENV در Render:
//   KAVENEGAR_API_KEY=xxx (الزامی)
//   SMS_SENDER=1000xxx (برای Send معمولی)
//   ADMIN_MOBILE=0912... (شماره مدیر)
//   SMS_PROVIDER=kavenegar
//
// برای Lookup (پیشنهادی - سریع‌تر و ارزان‌تر):
//   KAVENEGAR_TEMPLATE=visit-request (اسم پترنی که تو پنل کاوه‌نگار ساختی)
//   مثال پترن: "درخواست جدید از %token1% %token2% برای %token3%"
//   token = نام، token2 = موبایل، token3 = خودرو
//
//   KAVENEGAR_ADMIN_TEMPLATE=admin-notify (اختیاری - پترن جدا برای مدیر)
//   اگر ست نباشد از همان TEMPLATE یا Send استفاده می‌کند
// ------------------------------------------------------------

function getConfig() {
    const apiKey = String(process.env.KAVENEGAR_API_KEY || process.env.SMS_API_KEY || "").trim();
    const sender = String(process.env.SMS_SENDER || process.env.KAVENEGAR_SENDER || "").trim();
    const adminMobileRaw = String(process.env.ADMIN_MOBILE || process.env.SMS_ADMIN_MOBILE || "").trim();
    const template = String(process.env.KAVENEGAR_TEMPLATE || process.env.SMS_TEMPLATE || "").trim();
    const adminTemplate = String(process.env.KAVENEGAR_ADMIN_TEMPLATE || process.env.SMS_ADMIN_TEMPLATE || "").trim();
    const enabled = Boolean(apiKey);

    const adminMobiles = adminMobileRaw
        .split(/[,\s]+/)
        .map((m) => String(m).trim())
        .filter(Boolean);

    return { apiKey, sender, adminMobiles, template, adminTemplate, enabled };
}

function normalizeReceptor(mobile) {
    let s = String(mobile || "").trim().replace(/[\s\-\(\)]/g, "");
    if (s.startsWith("+98")) s = "0" + s.slice(3);
    if (s.startsWith("0098")) s = "0" + s.slice(4);
    if (s.startsWith("98") && s.length >= 12) s = "0" + s.slice(2);
    if (/^9\d{9}$/.test(s)) s = "0" + s;
    return s;
}

// متد معمولی Send
async function sendViaKavenegar({ receptor, message, sender }) {
    const { apiKey, sender: defaultSender } = getConfig();
    if (!apiKey) return { skipped: true };

    const finalSender = String(sender || defaultSender || "").trim();
    const finalReceptor = normalizeReceptor(receptor);

    if (!/^09\d{9}$/.test(finalReceptor)) {
        throw new Error(`شماره گیرنده نامعتبر: ${receptor}`);
    }

    const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
    const params = new URLSearchParams();
    params.append("receptor", finalReceptor);
    params.append("message", String(message || "").trim());
    if (finalSender) params.append("sender", finalSender);

    try {
        const res = await axios.post(url, params.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 10000,
        });
        const data = res.data || {};
        if (data.return && data.return.status === 200) {
            console.log(`SMS SEND to ${finalReceptor}: ${String(message).slice(0,50)}`);
            return { ok: true, data, method: "send" };
        } else {
            console.error("KAVENEGAR SEND ERROR:", JSON.stringify(data).slice(0,500));
            throw new Error(data.return ? data.return.message : "خطای کاوه‌نگار Send");
        }
    } catch (err) {
        const msg = err.response ? JSON.stringify(err.response.data).slice(0,500) : err.message;
        console.error("SMS SEND FAILED:", msg);
        throw new Error("ارسال پیامک ناموفق: " + msg);
    }
}

// متد Lookup - پترن (توصیه کاوه‌نگار)
async function lookupViaKavenegar({ receptor, template, token, token2, token3, token10, token20 }) {
    const { apiKey } = getConfig();
    if (!apiKey) return { skipped: true };

    const finalReceptor = normalizeReceptor(receptor);
    if (!/^09\d{9}$/.test(finalReceptor)) {
        throw new Error(`شماره گیرنده نامعتبر: ${receptor}`);
    }
    if (!template) {
        throw new Error("نام پترن (template) برای Lookup مشخص نشده");
    }

    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;
    const params = new URLSearchParams();
    params.append("receptor", finalReceptor);
    params.append("template", template);
    if (token) params.append("token", String(token).trim().slice(0,100));
    if (token2) params.append("token2", String(token2).trim().slice(0,100));
    if (token3) params.append("token3", String(token3).trim().slice(0,100));
    if (token10) params.append("token10", String(token10).trim().slice(0,100));
    if (token20) params.append("token20", String(token20).trim().slice(0,100));

    try {
        const res = await axios.post(url, params.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 10000,
        });
        const data = res.data || {};
        if (data.return && data.return.status === 200) {
            console.log(`SMS LOOKUP to ${finalReceptor} template=${template} token=${token}`);
            return { ok: true, data, method: "lookup" };
        } else {
            console.error("KAVENEGAR LOOKUP ERROR:", JSON.stringify(data).slice(0,500));
            throw new Error(data.return ? data.return.message : "خطای کاوه‌نگار Lookup");
        }
    } catch (err) {
        const msg = err.response ? JSON.stringify(err.response.data).slice(0,800) : err.message;
        console.error("SMS LOOKUP FAILED:", msg);
        throw new Error("Lookup ناموفق: " + msg);
    }
}

// اطلاع به مدیر - سعی می‌کند Lookup، اگر نشد Send
async function notifyAdminNewRequest({ firstName, lastName, mobile, carTitle, carId }) {
    const { adminMobiles, enabled, adminTemplate, template } = getConfig();
    if (!enabled || adminMobiles.length === 0) {
        console.log("SMS: ADMIN_MOBILE not set, admin notification skipped");
        return { skipped: true };
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const useTemplate = adminTemplate || template; // اگر پترن ادمین جدا داری

    const results = [];
    for (const adminMobile of adminMobiles) {
        try {
            let r;
            if (useTemplate) {
                // Lookup: token=نام، token2=موبایل مشتری، token3=خودرو
                r = await lookupViaKavenegar({
                    receptor: adminMobile,
                    template: useTemplate,
                    token: fullName.slice(0,30),
                    token2: mobile,
                    token3: carTitle.slice(0,30),
                });
            } else {
                // Send معمولی
                const message = `درخواست بازدید جدید\n${fullName}\n${mobile}\nخودرو: ${carTitle} (ID:${carId})\n${new Date().toLocaleString("fa-IR")}`;
                r = await sendViaKavenegar({ receptor: adminMobile, message });
            }
            results.push({ mobile: adminMobile, ok: true, method: r.method });
        } catch (e) {
            console.error(`Admin SMS to ${adminMobile} failed:`, e.message);
            results.push({ mobile: adminMobile, ok: false, error: e.message });
        }
    }
    return results;
}

// تایید به مشتری
async function sendCustomerConfirmation({ mobile, firstName, carTitle }) {
    const { enabled, template } = getConfig();
    if (!enabled) return { skipped: true };

    // اگر پترن مشتری داری (مثلاً verify)، می‌تونی جدا تعریف کنی
    const customerTemplate = String(process.env.KAVENEGAR_CUSTOMER_TEMPLATE || "").trim();

    try {
        if (customerTemplate) {
            return await lookupViaKavenegar({
                receptor: mobile,
                template: customerTemplate,
                token: firstName.slice(0,30),
                token2: carTitle.slice(0,30),
            });
        } else if (template && String(process.env.SMS_CUSTOMER_USE_LOOKUP || "").toLowerCase() === "true") {
            // اگر خواستی مشتری هم با همان پترن بره
            return await lookupViaKavenegar({
                receptor: mobile,
                template,
                token: firstName.slice(0,30),
                token2: carTitle.slice(0,30),
            });
        } else {
            const message = `${firstName} عزیز\nدرخواست بازدید شما برای ${carTitle} ثبت شد.\nبه زودی تماس می‌گیریم.`;
            return await sendViaKavenegar({ receptor: mobile, message });
        }
    } catch (e) {
        console.log("Customer SMS failed (non-critical):", e.message);
        return { ok: false, error: e.message };
    }
}

module.exports = {
    getConfig,
    sendViaKavenegar,
    lookupViaKavenegar,
    notifyAdminNewRequest,
    sendCustomerConfirmation,
};
