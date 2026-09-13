# مستندات

| فایل | درباره‌ی چه چیزی است |
|---|---|
| [admin-security.md](./admin-security.md) | محافظ روت‌های نوشتنی (`ADMIN_API_KEY` / `x-admin-key`)، چه‌طور روشنش کنند، چه محدودیتی هنوز باز است |
| [tenants.md](./tenants.md) | قالب پایه + پنل هر مشتری (`frontend/src/config/tenants`)، استراتژی برنچ برای تغییرات اختصاصی |
| [uploads-storage.md](./uploads-storage.md) | تصمیم موقتِ ذخیره‌ی عکس روی دیسک هاست و مراحل سوییچ به R2/S3 |
| [car-details-panel.md](./car-details-panel.md) | صفحه‌ی جزئیات خودرو در سایت و پنل ادمین؛ رفتار دکمه‌های ادمین و بخش‌های صفحه |
| [windows-git-recovery.md](./windows-git-recovery.md) | راهنمای قدم‌به‌قدم رفع ریپوی خراب روی ویندوز (git init در خانه، ریموت غلط، پوش ناموفق) |

## نقشه‌ی سریع کد
- فرم افزودن خودرو: `frontend/src/pages/AddCar.jsx` (فقط کمبوکس؛ تایپ فقط برای قیمت/توضیحات/«افزودن به کاتالوگ»)
- فرم ویرایش و حذف: `frontend/src/pages/EditCar.jsx` (از همان اجزای مشترک استفاده می‌کند)
- لیست/پنل: `frontend/src/pages/AdminCars.jsx` (دیپ‌لینک `#/new` ، `#/edit/:id` ، `#/car/:id` + کادر رمز ادمین)
- اجزای مشترک فرم: `frontend/src/components/admin/CarFormUI.jsx`
- منطق خالص فرم (اعتبارسنجی، payload، لیست سال/کشور): `frontend/src/utils/carForm.js`
- هوک کاتالوگ: `frontend/src/utils/useCarCatalog.js` → `GET /api/catalog/full`
- کلید ادمین سمت فرانت: `frontend/src/utils/adminAuth.js`
- گارد سمت سرور: `backend/src/middleware/adminGuard.js`
- find-or-create برند/مدل: `backend/src/services/catalogService.js` (در `createCar` و `updateCar`)

## آدرس‌ها
- پنل ادمین: `https://car-platform-9vv7.onrender.com/admin`
- فرم خودروی جدید: `https://car-platform-9vv7.onrender.com/admin#/new`
- وضعیت گارد: `https://car-platform-db.onrender.com/api/admin/status`
