const express = require("express");
const router = express.Router();

const dealershipController = require("../controllers/dealershipController");
const adminGuard = require("../middleware/adminGuard");

// لیست نمایندگی‌ها (برای کمبوکس فرم افزودن خودرو) — خواندنی و عمومی
router.get("/", dealershipController.getDealerships);

// ساخت نمایندگی فقط با رمز ادمین
router.post("/", adminGuard, dealershipController.createDealership);

module.exports = router;
