const axios = require("axios");

function getConfig() {
    const apiKey = String(process.env.KAVENEGAR_API_KEY || process.env.SMS_API_KEY || "").trim();
    const sender = String(process.env.SMS_SENDER || process.env.KAVENEGAR_SENDER || "").trim();
    const adminMobileRaw = String(process.env.ADMIN_MOBILE || process.env.SMS_ADMIN_MOBILE || "").trim();
    const template = String(process.env.KAVENEGAR_TEMPLATE || process.env.SMS_TEMPLATE || "").trim();
    const adminTemplate = String(process.env.KAVENEGAR_ADMIN_TEMPLATE || process.env.SMS_ADMIN_TEMPLATE || "").trim();
    const enabled = Boolean(apiKey);
    const adminMobiles = adminMobileRaw.split(/[\s,]+/).map((m) => String(m).trim()).filter(Boolean);
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
async function sendViaKavenegar({ receptor, message, sender }) {
    const { apiKey, sender: defaultSender } = getConfig();
    if (!apiKey) return { skipped: true };
    const finalSender = String(sender || defaultSender || "").trim();
    const finalReceptor = normalizeReceptor(receptor);
    if (!/^09\d{9}$/.test(finalReceptor)) throw new Error(`شماره گیرنده نامعتبر: ${receptor}`);
    const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
    const params = new URLSearchParams();
    params.append("receptor", finalReceptor);
    params.append("message", String(message || "").trim());
    if (finalSender) params.append("sender", finalSender);
    try {
        const res = await axios.post(url, params.toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 });
        const data = res.data || {};
        if (data.return && data.return.status === 200) {
            console.log(`SMS SEND to ${finalReceptor}: ${String(message).slice(0,80)}`);
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
async function lookupViaKavenegar({ receptor, template, token, token2, token3, token10, token20 }) {
    const { apiKey } = getConfig();
    if (!apiKey) return { skipped: true };
    const finalReceptor = normalizeReceptor(receptor);
    if (!/^09\d{9}$/.test(finalReceptor)) throw new Error(`شماره گیرنده نامعتبر: ${receptor}`);
    if (!template) throw new Error("نام پترن (template) برای Lookup مشخص نشده");
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
        const res = await axios.post(url, params.toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 });
        const data = res.data || {};
        if (data.return && data.return.status === 200) {
            console.log(`SMS LOOKUP to ${finalReceptor} template=${template} token=${token} token2=${token2} token3=${token3}`);
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
async function notifyAdminNewRequest({ firstName, lastName, mobile, carTitle, carId }) {
    const { adminMobiles, enabled, adminTemplate, template, sender } = getConfig();
    if (!enabled || adminMobiles.length === 0) {
        console.log("SMS: ADMIN_MOBILE not set, admin notification skipped");
        return { skipped: true };
    }
    const fullNameRaw = `${firstName} ${lastName}`.trim() || "کاربر";
    const carRaw = String(carTitle || "").trim() || `ID:${carId}`;
    const results = [];
    for (const adminMobile of adminMobiles) {
        try {
            let r;
            if (sender) {
                // با خط خدماتی - بدون - و با فاصله کامل
                const message = `درخواست بازدید جدید
نام: ${fullNameRaw}
شماره: ${mobile}
خودرو: ${carRaw}
${new Date().toLocaleString("fa-IR")}`;
                r = await sendViaKavenegar({ receptor: adminMobile, message });
            } else {
                // بدون sender - Lookup با -
                const sanitize = (s) => String(s || "").trim().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF\-]/g, "").slice(0, 30) || "x";
                const fullName = sanitize(fullNameRaw);
                const carSafe = sanitize(carRaw);
                const useTemplate = adminTemplate || template || "admin-notify";
                r = await lookupViaKavenegar({ receptor: adminMobile, template: useTemplate, token: fullName, token2: mobile, token3: carSafe });
            }
            results.push({ mobile: adminMobile, ok: true, method: r.method });
        } catch (e) {
            console.error(`Admin SMS to ${adminMobile} failed:`, e.message);
            results.push({ mobile: adminMobile, ok: false, error: e.message });
        }
    }
    return results;
}
async function sendCustomerConfirmation({ mobile, firstName, carTitle }) {
    const { enabled, sender } = getConfig();
    if (!enabled) return { skipped: true, reason: "disabled" };
    const customerTemplate = String(process.env.KAVENEGAR_CUSTOMER_TEMPLATE || "").trim();
    const useLookupForCustomer = String(process.env.SMS_CUSTOMER_USE_LOOKUP || "").toLowerCase() === "true";
    if (!customerTemplate && !useLookupForCustomer && !sender) {
        console.log("Customer SMS skipped (no sender, no customer template) - admin only");
        return { skipped: true, reason: "no sender/template for customer" };
    }
    try {
        if (customerTemplate) {
            return await lookupViaKavenegar({ receptor: mobile, template: customerTemplate, token: String(firstName).replace(/\s+/g,"-").slice(0,30), token2: String(carTitle).replace(/\s+/g,"-").slice(0,30) });
        } else if (useLookupForCustomer) {
            const { template } = getConfig();
            return await lookupViaKavenegar({ receptor: mobile, template, token: String(firstName).replace(/\s+/g,"-").slice(0,30), token2: String(carTitle).replace(/\s+/g,"-").slice(0,30) });
        } else {
            const message = `${firstName} عزیز\nدرخواست بازدید شما برای ${carTitle} ثبت شد.\nبه زودی تماس می‌گیریم.`;
            return await sendViaKavenegar({ receptor: mobile, message });
        }
    } catch (e) {
        console.log("Customer SMS failed (non-critical):", e.message);
        return { ok: false, error: e.message };
    }
}
module.exports = { getConfig, sendViaKavenegar, lookupViaKavenegar, notifyAdminNewRequest, sendCustomerConfirmation };
