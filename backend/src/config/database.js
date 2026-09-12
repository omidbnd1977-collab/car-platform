const { Pool } = require("pg");
require("dotenv").config();

// روی سرور (مثل Render) معمولاً فقط DATABASE_URL در دسترس است،
// بنابراین اگر ست شده باشد از آن استفاده می‌کنیم؛ در غیر این صورت
// همان تنظیمات قبلی (DB_HOST و ...) بدون تغییر باقی می‌ماند.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      }
    });

module.exports = pool;
