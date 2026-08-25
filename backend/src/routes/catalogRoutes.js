const express = require("express");

const router = express.Router();

const catalogController =
require("../controllers/catalogController");


router.get(
"/brands",
catalogController.getBrands
);


router.get(
"/models/:brandId",
catalogController.getModelsByBrand
);


module.exports = router;