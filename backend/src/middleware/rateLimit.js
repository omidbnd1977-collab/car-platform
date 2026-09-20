/**
 * Simple in-memory rate limiter - بدون وابستگی خارجی
 * برای جلوگیری از سیل درخواست و هزینه SMS
 */

const stores = new Map(); // name -> Map(key -> {count, reset})

function getStore(name) {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name);
}

// پاکسازی دوره‌ای هر 5 دقیقه
setInterval(() => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [k, v] of store.entries()) {
      if (v.reset < now) store.delete(k);
    }
  }
}, 5 * 60 * 1000).unref();

function createRateLimiter({ name = "default", windowMs = 15 * 60 * 1000, max = 100, keyGenerator, message }) {
  const store = getStore(name);
  return (req, res, next) => {
    try {
      const key = (keyGenerator ? keyGenerator(req) : null) || String(req.headers["x-forwarded-for"] || req.ip || "unknown").split(",")[0].trim() || "unknown";
      const now = Date.now();
      let entry = store.get(key);
      if (!entry || entry.reset < now) {
        entry = { count: 1, reset: now + windowMs };
        store.set(key, entry);
        return next();
      }
      entry.count++;
      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.reset - now) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({
          error: message || `تعداد درخواست زیاد است. ${Math.ceil(retryAfter/60)} دقیقه دیگر تلاش کنید.`,
          code: "RATE_LIMIT",
          retryAfter,
        });
      }
      return next();
    } catch (e) {
      return next();
    }
  };
}

// لیمترهای آماده
const globalLimiter = createRateLimiter({
  name: "global",
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "تعداد درخواست‌ها زیاد است. لطفاً چند دقیقه صبر کنید.",
});

const authLimiter = createRateLimiter({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "تعداد تلاش ورود زیاد است. ۱۵ دقیقه دیگر تلاش کنید.",
});

const visitRequestLimiter = createRateLimiter({
  name: "visit",
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "شما اخیراً چند درخواست ثبت کرده‌اید. ۱۰ دقیقه دیگر تلاش کنید.",
});

const smsLimiter = createRateLimiter({
  name: "sms",
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "تعداد پیامک ارسالی زیاد است. ۱ ساعت دیگر تلاش کنید.",
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter,
  visitRequestLimiter,
  smsLimiter,
};
