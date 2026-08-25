const express = require("express");
const router = express.Router();

const publicController = require("../controllers/publicController");


// لیست خودروهای فعال
router.get("/cars", publicController.getActiveCars);


// جزئیات یک خودرو
router.get("/cars/:id", publicController.getCarDetails);


module.exports = router;