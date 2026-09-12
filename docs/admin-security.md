# محافظ روت‌های نوشتنی (adminGuard)

## مشکل چه بود
`/admin` و API‌های نوشتنی بدون هیچ احراز هویتی باز بودند: هر کسی می‌توانست با
`POST /api/cars` خودرو ثبت کند، با `PUT/DELETE /api/cars/:id` ویرایش/حذف کند،
عکس آپلود کند و با `POST /api/catalog/brands|models` کاتالوگ را عوض کند.
(`authMiddleware`/`roleMiddleware` در ریپو بودند ولی فقط روی `adminRoutes` و
`purchaseRoutes` وصل شده بودند.)

## الان چطور کار می‌کند
`backend/src/middleware/adminGuard.js` روی همه‌ی روت‌های نوشتنی نشسته است:

| روت | محافظت |
|---|---|
| `POST /api/cars` ، `PUT /api/cars/:id` ، `DELETE /api/cars/:id` | ✅ |
| `POST /api/cars/:carId/images` ، `.../images/upload` ، `DELETE .../images/:imageId` ، `PUT .../images/:imageId/primary` ، `PUT .../images/reorder` | ✅ |
| `POST /api/cars/backfill-images` | ✅ |
| `POST /api/catalog/brands` ، `POST /api/catalog/models` | ✅ |
| `POST /api/dealerships` | ✅ |
| `GET /api/cars` ، `GET /api/cars/:id` ، `GET /api/catalog/*` ، `GET /api/dealerships` | باز (سایت و کمبوکس‌ها لازم دارند) |

دو راه پذیرش:

1. **هدر `x-admin-key: <ADMIN_API_KEY>`** — ساده‌ترین راه، همین که پنل ادمین استفاده می‌کند.
2. **`Authorization: Bearer <JWT>`** با `role: SUPER_ADMIN` یا `ADMIN`
   (توکنِ موجود `POST /api/auth/login`، وقتی `JWT_SECRET` ست باشد).

## روشن‌کردن (یک متغیر محیطی)
1. Render → سرویس **backend** → Environment → `ADMIN_API_KEY` = یک رشته‌ی بلند
   (مثلاً خروجی `openssl rand -hex 24`).
2. Redeploy.
3. در لاگ شروع باید این خط را ببینی:
   `ADMIN GUARD: روشن — درخواست‌های نوشتنی نیاز به x-admin-key یا توکن ادمین دارند (کلید 48 حرفی).`
   اگر نوشته `ADMIN GUARD: خاموش (ADMIN_API_KEY تنظیم نشده)` یعنی متغیر ست نشده.
4. پنل `https://car-platform-9vv7.onrender.com/admin` کادر مشکی «رمز ورود ادمین»
   را نشان می‌دهد؛ رمز را یک‌بار وارد کن، در `localStorage` همان مرورگر
   (کلید `cp_admin_key`) می‌ماند و با هر درخواست نوشتنی فرستاده می‌شود.

وقتی رمز را در پنل می‌زنی، اول یک‌بار تست می‌شود: پنل `POST /api/catalog/brands` با نام
یک‌حرفی می‌فرستد — اگر `400` برگردد یعنی از گارد رد شده و به اعتبارسنجی رسیده (رمز درست است)
و اگر `401` برگردد پیام «این رمز مورد قبول سرور نبود» می‌بینی. چیزی در دیتابیس درج نمی‌شود.
همین بررسی موقع باز‌کردن پنل هم انجام می‌شود، تا اگر `ADMIN_API_KEY` عوض شده باشد، رمز
قدیمی بی‌صدا در مرورگر نماند.

برای تست از خط فرمان:

```bash
curl -s -X DELETE https://car-platform-db.onrender.com/api/cars/9999        # 401 ADMIN_KEY_REQUIRED
curl -s -X DELETE -H "x-admin-key: $ADMIN_API_KEY" https://.../api/cars/9999
curl -s https://car-platform-db.onrender.com/api/admin/status               # {"enabled":true,...}
```

## چرا «خاموش بودنِ پیش‌فرض»
اگر گارد پیش‌فرض اجباری بود، با اولین دیپلویِ بک‌اند بدون ست‌کردن env، پنل ادمین
قفل می‌شد و هیچ‌کس نمی‌توانست خودرو ثبت کند. برای همین: بدون `ADMIN_API_KEY`
رفتار مثل قبل است، ولی
- در لاگ سرور هشدار می‌دهد،
- `GET /api/admin/status` مقدار `enabled:false` را برمی‌گرداند،
- و پنل ادمین یک بنر زرد نشان می‌دهد: «محافظ ادمین خاموش است…».

## محدودیت‌هایی که هنوز باقی است (بدون روتوش)
- این یک **کلید مشترک** است، نه کاربر و رمز شخصی: همه‌ی ادمین‌ها یک کلید دارند و
  در `localStorage` مرورگر ذخیره می‌شود. برای «این تغییر را علی انجام داد» باید
  سراغ لاگ/تاریخچه رفت.
- کلید با HTTPS فرستاده می‌شود (Render خودش HTTPS دارد) ولی روی HTTP معمولی لو می‌رود.
- پنل هنوز لاگین ندارد؛ `users`/`/api/auth/login` برای این مسیر استفاده نمی‌شود.
  پیشنهاد مرحله‌ی بعد: یک فرم لاگین کوچک سمت فرانت + ساخت کاربر `SUPER_ADMIN`،
  و بعد حذف `ADMIN_API_KEY` (همان توکن JWT پذیرفته می‌شود).
- برای بستن کامل، `GET /api/dealerships` و `GET /api/catalog/full` را هم می‌توان
  guarded کرد (الان عمداً بازند تا سایت و فرم بدون رمز کرش نکنند).
- تعویض کلید = ست‌کردن مقدار تازه در Render و ریدپلوی؛ کاربران باید رمز را در پنل
  دوباره وارد کنند (دکمه‌ی «پاک کردن رمز ذخیره‌شده» هم هست).

## کدهای مرتبط
- `backend/src/middleware/adminGuard.js` (گارد + `GET /api/admin/status`)
- `backend/src/routes/carRoutes.js` ، `catalogRoutes.js` ، `dealershipRoutes.js` ، `adminRoutes.js`
- `frontend/src/utils/adminAuth.js` (کلید در localStorage، `adminFetch`، هدر)
- `frontend/src/pages/AdminCars.jsx` (کادر «رمز ورود ادمین» + بنرها)
