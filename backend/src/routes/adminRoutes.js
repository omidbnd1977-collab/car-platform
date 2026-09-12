const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const adminGuard = require("../middleware/adminGuard");


// وضعیت محافظ روت‌های نوشتنی — عمداً بدون احراز هویت است تا
// پنل بتواند بگوید «ADMIN_API_KEY تنظیم نشده» و از کاربر رمز بخواهد.
router.get("/status", adminGuard.guardStatus);


// لیست خودروهای در انتظار تایید
router.get(
  "/cars/pending",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  adminController.getPendingCars
);


// تایید خودرو
router.put(
  "/cars/:id/approve",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  adminController.approveCar
);


// رد خودرو
router.put(
  "/cars/:id/reject",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  adminController.rejectCar
);


module.exports = router;