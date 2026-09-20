const express = require("express");
const router = express.Router();
const visitController = require("../controllers/visitRequestController");
const adminGuard = require("../middleware/adminGuard");
const { visitRequestLimiter, smsLimiter } = require("../middleware/rateLimit");

// ------------------------------------------------------------
// عمومی - ثبت درخواست بازدید - با Rate Limit (جلوگیری از سیل SMS)
// POST /api/visit-requests - 5 درخواست در 10 دقیقه per IP
// ------------------------------------------------------------
router.post("/", visitRequestLimiter, visitController.createVisitRequest);

// ------------------------------------------------------------
// ادمین - لیست و مدیریت - با Rate Limit برای bulk-sms
// ------------------------------------------------------------
router.get("/export/csv", adminGuard, visitController.exportVisitRequestsCsv);
router.post("/bulk-sms", adminGuard, smsLimiter, visitController.bulkSmsToConsented);
router.get("/", adminGuard, visitController.getVisitRequests);
router.get("/:id", adminGuard, visitController.getVisitRequestById);
router.patch("/:id/status", adminGuard, visitController.updateVisitRequestStatus);
router.put("/:id/status", adminGuard, visitController.updateVisitRequestStatus);

module.exports = router;
