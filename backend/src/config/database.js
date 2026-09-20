const { Pool } = require("pg");
require("dotenv").config();

// امنیت SSL دیتابیس - فیکس MITM
// قبلاً در هر دو حالت rejectUnauthorized:false بود که گواهی سرور را چک نمی‌کرد.
// الان:
// - در production به‌صورت پیش‌فرض گواهی تایید می‌شود (rejectUnauthorized:true)
// - اگر هاست دیتابیس (مثل بعضی سرویس‌های Render) گواهی self-signed دارد، می‌توان با ENV
//   DB_SSL_REJECT_UNAUTHORIZED=false آن را موقتاً غیرفعال کرد (با آگاهی از ریسک)
// - در development برای سادگی false می‌ماند

const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
const explicitReject = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "").toLowerCase();
let rejectUnauthorized;
if (explicitReject === "false" || explicitReject === "0") {
  rejectUnauthorized = false;
} else if (explicitReject === "true" || explicitReject === "1") {
  rejectUnauthorized = true;
} else {
  // پیش‌فرض امن: production=true, development=false
  rejectUnauthorized = isProd ? true : false;
}

const sslConfig = rejectUnauthorized === false ? { rejectUnauthorized: false } : { rejectUnauthorized: true };

if (!isProd && rejectUnauthorized === false) {
  console.log("DB SSL: rejectUnauthorized=false (development)");
} else if (rejectUnauthorized === false) {
  console.warn("DB SSL: rejectUnauthorized=false - گواهی دیتابیس تایید نمی‌شود! فقط برای هاست‌های self-signed موقت استفاده کنید و در production مقدار را true بگذارید یا DB_SSL_REJECT_UNAUTHORIZED را حذف کنید.");
} else {
  console.log("DB SSL: rejectUnauthorized=true (secure - گواهی تایید می‌شود)");
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: sslConfig,
    });

module.exports = pool;
