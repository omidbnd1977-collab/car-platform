const express = require("express");

const router = express.Router();

const imageController =
require("../controllers/imageController");



// تصاویر یک خودرو

router.get(
"/car/:carId",
imageController.getCarImages
);



// تایید

router.put(
"/:id/approve",
imageController.approveImage
);



// رد

router.put(
"/:id/reject",
imageController.rejectImage
);



// حذف

router.delete(
"/:id",
imageController.deleteImage
);



// عکس اصلی

router.put(
"/:id/main",
imageController.setMainImage
);



module.exports = router;