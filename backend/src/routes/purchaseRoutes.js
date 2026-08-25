const express = require("express");
const router = express.Router();

const purchaseController = require("../controllers/purchaseController");
const authMiddleware = require("../middleware/authMiddleware");

// ثبت درخواست خرید
router.post(
  "/",
  authMiddleware,
  purchaseController.createRequest
);

// مشاهده درخواست‌ها
router.get(
  "/",
  authMiddleware,
  purchaseController.getRequests
);

// تایید درخواست خرید
router.put(
  "/:id/approve",
  authMiddleware,
  purchaseController.approveRequest
);

// رد درخواست خرید
router.put(
  "/:id/reject",
  authMiddleware,
  purchaseController.rejectRequest
);

module.exports = router;