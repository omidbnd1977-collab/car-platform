const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const adminGuard = require("../middleware/adminGuard");

// تصاویر یک خودرو - عمومی (برای نمایش در سایت)
router.get("/car/:carId", imageController.getCarImages);

// تایید - فقط ادمین
router.put("/:id/approve", adminGuard, imageController.approveImage);

// رد - فقط ادمین
router.put("/:id/reject", adminGuard, imageController.rejectImage);

// حذف - فقط ادمین
router.delete("/:id", adminGuard, imageController.deleteImage);

// عکس اصلی - فقط ادمین
router.put("/:id/main", adminGuard, imageController.setMainImage);

module.exports = router;
