const multer = require("multer");

// ============================================================
//  MIDDLEWARE آپلود تصویر
// ============================================================
// ۱) حجم مجاز: ۱۵ مگابایت (قبلاً ۵ مگابایت بود و عکس‌های
//    دوربین‌های مدرن معمولاً بیشتر از این حجم دارند).
// ۲) فرمت‌های مجاز: jpg/png/webp + gif.
// ۳) memoryStorage: فایل روی دیسک نوشته نمی‌شود، بلکه در حافظه
//    می‌ماند و storageService تصمیم می‌گیرد کجا ذخیره شود
//    (دیسک محلی یا S3/R2). دلیلش این است که دیسک Render
//    موقت است و فایل‌های نوشته‌شده روی آن با هر دیپلوی
//    پاک می‌شوند.
// ============================================================

const MAX_FILE_SIZE_MB = 15;

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "image/gif",
];

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    },

    fileFilter: function (req, file, cb) {
        const mimeType = String(file.mimetype || "").toLowerCase();

        if (ALLOWED_MIME_TYPES.includes(mimeType)) {
            cb(null, true);

            return;
        }

        const error = new Error(
            "Only image files are allowed (jpeg, png, webp, gif) up to " +
                MAX_FILE_SIZE_MB +
                " MB. Received: " +
                (file.mimetype || "unknown type")
        );

        // خطای فرمت، خطای کاربر است نه سرور →
        // global error handler با همین کد وضعیت پاسخ می‌دهد.
        error.status = 400;

        cb(error);
    },
});

module.exports = upload;

// برای استفاده در پیام‌های خطا / مستندات
module.exports.MAX_FILE_SIZE_MB = MAX_FILE_SIZE_MB;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
