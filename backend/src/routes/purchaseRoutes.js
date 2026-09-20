const express = require("express");
const router = express.Router();

const purchaseController = require("../controllers/purchaseController");
const authMiddleware = require("../middleware/authMiddleware");
const adminGuard = require("../middleware/adminGuard");

// ثبت درخواست خرید - مشتری لاگین کرده
router.post(
  "/",
  authMiddleware,
  purchaseController.createRequest
);

// مشاهده درخواست‌ها - فقط ادمین (SUPER_ADMIN via JWT یا x-admin-key)
router.get(
  "/",
  adminGuard,
  purchaseController.getRequests
);

// تایید درخواست خرید - فقط ادمین
router.put(
  "/:id/approve",
  adminGuard,
  purchaseController.approveRequest
);

// رد درخواست خرید - فقط ادمین
router.put(
  "/:id/reject",
  adminGuard,
  purchaseController.rejectRequest
);

module.exports = router;
