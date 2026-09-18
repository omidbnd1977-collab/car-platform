const express = require("express");
const router = express.Router();
const carController = require("../controllers/carController");
const upload = require("../middleware/upload");
const adminGuard = require("../middleware/adminGuard");

// خواندن — عمومی (سایت و اپ همین‌ها را لازم دارد)
router.get("/", carController.getCars);
router.get("/sold", carController.getSoldCars);
router.get("/:id", carController.getCarById);

// نوشتن — با رمز ادمین (adminGuard). اگر ADMIN_API_KEY تنظیم نشده
// باشد گارد خاموش است و رفتار مثل قبل می‌ماند.
router.post("/", adminGuard, carController.createCar);
router.put("/:id", adminGuard, carController.updateCar);
router.delete("/:id", adminGuard, carController.deleteCar);

// ============================
// CAR IMAGE MANAGEMENT
// ============================
router.put(
    "/:carId/images/:imageId/primary",
    adminGuard,
    carController.setPrimaryImage
);
router.delete(
    "/:carId/images/:imageId",
    adminGuard,
    carController.deleteCarImage
);
router.put(
    "/:carId/images/reorder",
    adminGuard,
    carController.reorderCarImages
);
router.post(
    "/:carId/images",
    adminGuard,
    carController.addCarImage
);
router.post(
    "/:carId/images/upload",
    adminGuard,
    upload.single("image"),
    carController.uploadCarImage
);

// ============================
// CATALOG IMAGE BACKFILL
// (برای ماشین‌های موجود بدون عکس)
// ============================
router.post(
    "/backfill-images",
    adminGuard,
    carController.backfillCatalogImages
);

module.exports = router;
