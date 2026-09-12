# قالب پایه و پنل‌های مشتری‌ها (tenants)

## مدل فکری
یک کد‌بیس، چند پنل. به‌جای fork کردن پروژه برای هر مشتری:

- `frontend/src/config/tenants/base.js` → **قالب پایه** (همه‌ی کلیدهای پیش‌فرض).
- `frontend/src/config/tenants/<slug>.js` → **فقط تفاوت‌های یک مشتری**.
- `frontend/src/config/tenants/index.js` → ریجیستری + انتخاب مشتری فعال.
- `frontend/src/config/dealerConfig.js` → چیزی که بقیه‌ی کد import می‌کند؛
  خروجی‌اش `merge(base, tenant)` است، پس هیچ کامپوننتی لازم نیست عوض شود.

منطق انتخاب، خالص و قابل تست است: `frontend/src/config/tenants/resolve.js`.

## کلیدهای قابل تنظیم برای هر مشتری
`name` `shortName` `city` `country` `cityFa` `countryFa` `cityEn` `countryEn`
`phone` `whatsapp` `email` `instagram` `logo` `primaryColor` `secondaryColor`
`currency` `defaultLanguage` `supportedLanguages` `features{whatsapp,shipping,customs,financing,testDrive}`
`tenant` (اسلاگ، برای لاگ و هدر پنل ادمین)

ادغام، سطحی است به‌جز آبجکت‌های مثل `features` که در آن‌ها کلید به‌کلید merge می‌شود
(`mergeConfig`)؛ پس برای روشن‌کردن `financing` لازم نیست کل `features` را دوباره بنویسی.

## اولویت تشخیص مشتری فعال
1. `?dealer=<slug>` روی آدرس (پیش‌نمایش سریع: `/admin?dealer=acme`)
2. `localStorage` کلید `cp_tenant`
3. زیردامه: `acme.example.com` → `acme` (دامنه‌های `*.onrender.com`، `*.netlify.app`،
   `*.vercel.app`، `localhost` و `car-platform*` نادیده گرفته می‌شوند)
4. env `VITE_TENANT` (یا `TENANT`)
5. پیش‌فرض: `qeshm`

اسلاگِ ثبت‌نشده هیچ‌وقت پنل را نمی‌شکند — به پیش‌فرض برمی‌گردد.

## اضافه‌کردن یک مشتری (چک‌لیست)
```bash
# ۱) فایل کانفیگ
cp frontend/src/config/tenants/qeshm.js frontend/src/config/tenants/acme.js
#    بعد نام/شهر/رنگ/ارز/فیتچر را در همان فایل عوض کن

# ۲) ثبت در ریجیستری  → frontend/src/config/tenants/index.js
#    import { acmeTenant } from "./acme";
#    export const tenants = { base: {}, qeshm: qeshmTenant, acme: acmeTenant };

# ۳) تست سریع
cd frontend && npm run build
```
```yaml
# ۴) Render: یک سرویس Frontend جدید از همین ریپو
name: car-platform-acme
rootDir: frontend
buildCommand: npm install && npm run build
staticPublishPath: dist
envVars:
  - key: VITE_TENANT
    value: acme
  - key: VITE_API_URL
    value: https://car-platform-acme-db.onrender.com/api   # بک‌اند اختصاصی
```
```sql
-- ۵) دیتابیس آن مشتری: یک نمایندگی با همان نام بساز (فرم خودرو این را در کمبوکس می‌گیرد)
INSERT INTO dealerships (name, city, country) VALUES ('Acme Motors', 'Dubai', 'UAE');
```
```bash
# ۶) رمز ادمین همان سرویس (docs/admin-security.md)
```

## تغییرات اختصاصی عمیق (کامپوننت/جریان کاری متفاوت)
لایه‌ی config فقط ظاهر/متن/ارز/فیچر را پوشش می‌دهد. اگر مشتری واقعاً «چیز دیگری»
می‌خواهد (چیدمان متفاوت، فیلد اضافه، درگاه متفاوت):

- `main` = قالب پایه. هیچ تغییر اختصاصی داخل `main` نمی‌نشیند.
- هر مشتری = برنچ `tenant/<slug>` از `main`.
- تغییرات عمومی را در `main` بزن و بعد در برنچ مشتری merge کن:
  `git checkout tenant/acme && git merge main`
- هرگز `tenant/*` را مستقیم به `main` merge نکن؛ اگر چیزی برای همه جذاب بود،
  دستی و تمیز بردارش کن (code review بعدش).
- اگر تعداد برنچ‌ها از ۳–۴ بیشتر شد، چک‌اوت موازی با `git worktree` راحت‌تر است:
  `git worktree add ../acme tenant/acme`
- فایل‌های `frontend/src/config/tenants/<slug>.js` را در برنچ مشتری هم نگه دار:
  این‌طوری هم کاستومایز ظاهری و هم کد اختصاصی در یک جا سند می‌شود.

## چه چیزی عمداً انجام نشده
- **تک‌دیتابیس چندنفره نیست:** هر مشتری دیتابیس خودش را دارد
  (`DATABASE_URL` خودش). اسکوپ‌کردن رکوردها با `dealership_id`/`tenant` در یک دیتابیس
  انجام نشده، پس دو مشتری روی یک DB نگذار تا داده قاطی نشود.
- پنل ادمینِ «ویرایش ظاهر هر مشتری» وجود ندارد؛ فعلاً با فایل و دیپلوی.
- CSS پر-فشار (تم کامل) از `primaryColor` می‌آید ولی همه‌ی جایلایه‌ها را کاور نمی‌کند.
- `dealerConfig` هنگام build داخل باندل می‌نشیند (نه زمان اجرا) — برای یک سرویس‌به‌ازای‌مشتری
  که همین است و ساده‌تر/سریع‌تر از fetch موقع رندر.
