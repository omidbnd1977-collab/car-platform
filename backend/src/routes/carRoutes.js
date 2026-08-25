const express = require("express");

const router = express.Router();

const carController = require("../controllers/carController");

const upload = require("../middleware/upload");
router.post("/", carController.createCar);

router.get("/", carController.getCars);

router.get("/:id", carController.getCarById);

router.put("/:id", carController.updateCar);




// ============================
// CAR IMAGE MANAGEMENT
// ============================

router.put(
    "/:carId/images/:imageId/primary",
    carController.setPrimaryImage
);


router.delete(
    "/:carId/images/:imageId",
    carController.deleteCarImage
);

router.put(
"/:carId/images/reorder",
carController.reorderCarImages
);

router.post(
"/:carId/images",
carController.addCarImage
);

router.post(
"/:carId/images/upload",
upload.single("image"),
carController.uploadCarImage
);


module.exports = router;