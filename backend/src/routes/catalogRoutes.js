const express = require("express");

const router = express.Router();

const catalogController =
require("../controllers/catalogController");
const adminGuard = require("../middleware/adminGuard");

router.get(
"/brands",
catalogController.getBrands
);


router.get(
"/models/:brandId",
catalogController.getModelsByBrand
);

// همه‌ی کاتالوگ یک‌جا: برندها + مدل‌های هر برند + برندها/مدل‌هایی
// که فقط در جدول cars هستند (تا کمبوکس فرم خودرو چیزی را جا نیندازد)
router.get(
"/full",
catalogController.getCatalogFull
);


// ایجاد برند اگر در کاتالوگ نبود (پنل «افزودن خودرو»)
router.post(
"/brands",
adminGuard,
catalogController.createBrand
);


// ایجاد مدل برای یک برند اگر در کاتالوگ نبود
router.post(
"/models",
adminGuard,
catalogController.createModel
);


module.exports = router;
