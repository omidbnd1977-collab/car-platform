const express = require("express");
const router = express.Router();

const dealershipController = require("../controllers/dealershipController");

router.post("/", dealershipController.createDealership);

module.exports = router;