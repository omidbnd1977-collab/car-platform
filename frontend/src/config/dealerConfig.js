// ------------------------------------------------------------
// پیکربندی نمایشیِ همین مشتری
// ------------------------------------------------------------
// قبلاً همه‌ی مقدارها داخل این فایل بودند. حالا فقط «قالب پایه +
// override مشتری فعال» است و خودِ مقدارها در config/tenants/*
// زندگی می‌کنند؛ پس بقیه‌ی کد (Home، CarCard، CarDetails، پنل
// ادمین، فرم خودرو) بدون تغییر کار می‌کنند.
//
//  preview سریع:  /?dealer=qeshm
//  مشتری تازه:    یک فایل در src/config/tenants/<slug>.js بساز
//                 و VITE_TENANT=<slug> را در سرویس آن مشتری بگذار.
//  راهنما:        docs/tenants.md
// ------------------------------------------------------------

import dealerConfig, { tenantSlug, tenants, DEFAULT_TENANT } from "./tenants";

export { tenantSlug, tenants, DEFAULT_TENANT };

export default dealerConfig;
