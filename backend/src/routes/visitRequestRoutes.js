const express = require("express");
const router = express.Router();
const visitController = require("../controllers/visitRequestController");
const adminGuard = require("../middleware/adminGuard");

// ------------------------------------------------------------
// عمومی - ثبت درخواست بازدید
// POST /api/visit-requests
// ------------------------------------------------------------
router.post("/", visitController.createVisitRequest);

// ------------------------------------------------------------
// ادمین - لیست و مدیریت
// ------------------------------------------------------------
router.get("/", adminGuard, visitController.getVisitRequests);
router.get("/:id", adminGuard, visitController.getVisitRequestById);
router.patch("/:id/status", adminGuard, visitController.updateVisitRequestStatus);
router.put("/:id/status", adminGuard, visitController.updateVisitRequestStatus);

module.exports = router;
