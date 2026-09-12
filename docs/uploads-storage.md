# محل ذخیره‌ی عکس‌ها — تصمیم موقت: دیسک هاست

## وضعیت فعلی (عمدی)
`STORAGE_PROVIDER` روی Render تنظیم **نشده** است، پس
`backend/src/services/storageService.js` در حالت `local` کار می‌کند:
فایل‌ها در `backend/uploads/cars/` ذخیره و از همان‌جا با
`/uploads/cars/<file>` سرو می‌شوند.

این حالت روی پلن رایگان Render یعنی **با هر دیپلوی/ری‌استارت پوشه پاک می‌شود**
و لینک عکس‌های قدیمی می‌شکند (رفتار دیده‌شده در production؛ مسیر دیسک ephemeral است).
طبق تصمیم، فعلاً همین‌طور می‌ماند و مایگرشن به استورج دائمی در program بعدی است.

## دو چیزی که برای همین حالتِ موقت انجام شده
1. مسیر و پیشوند `/uploads` از یک منبع (`storageService`) خوانده می‌شود و
   `server.js` همان را `express.static` می‌کند؛ در حالت S3/R2 هم سروِ فایل‌های
   قدیمی روی دیسک ادامه پیدا می‌کند تا موقع سوییچ، رکوردهای قبلی یکدفعه نشکنند.
2. لاگ شروع سرویس یک خط `STORAGE: {...}` چاپ می‌کند (و در صورت پیکربندی ناقص
   `STORAGE MISCONFIGURED: ...`) تا وضعیت ذخیره‌سازی از تب Log پیداست باشد.
   در پنل ادمین هم یک یادداشت کوچک هست که عکس‌ها موقتی‌اند.

## هر وقت خواستی دائمی‌اش کنی (Cloudflare R2 نمونه)
```bash
# R2: یک باکت + یک API Token با权限 Write + دامنه‌ی عمومی
```
```yaml
# Render → backend → Environment
STORAGE_PROVIDER: r2
S3_BUCKET:        car-platform
S3_REGION:        auto
S3_ENDPOINT:      https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID: <...>
S3_SECRET_ACCESS_KEY: <...>          # secret
S3_PUBLIC_BASE_URL: https://pub-<public-token>.r2.dev   # برای R2 الزامی
S3_KEY_PREFIX:      cars
```
سپس Redeploy و در لاگ باید `STORAGE: {"provider":"r2",...}` را ببینی.

### رکوردهای قدیمی (تاریخی که `/uploads/...` دارد)
فایل‌های قدیمی روی دیسک دیگر وجود ندارند، پس دو راه هست:
- از پنل، عکس‌ها را دوباره آپلود کن (راه سالم)، یا
- اگر جایی بکاپ فایل داری، بعد از آپلود در باکت:

```sql
UPDATE car_images
SET image_url = replace(image_url, '/uploads/', 'https://pub-<id>.r2.dev/')
WHERE image_url LIKE '/uploads/%';
```

و برای اینکه فایل‌های جدید آپلودی هم روی دیسک نمانند، بعد از سوییچ یک‌بار
`GET /uploads/...` را روی یک فایل تازه تست کن (باید redirect/URL باکت باشد).

## کدهای مرتبط
- `backend/src/services/storageService.js` (local/S3/R2، امضای SigV4، delete)
- `backend/src/middleware/upload.js` (sقف ۱۵ مگا، jpg/png/webp/gif)
- `backend/src/controllers/carController.js` (`uploadCarImage`، `deleteCarImage`، `deleteCar` که فایل‌ها را هم best-effort پاک می‌کند)
