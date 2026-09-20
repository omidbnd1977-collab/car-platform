const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const adminGuard = require("../middleware/adminGuard");

// عمومی - لیست شاخه‌های فعال (برای انتخاب در سایت)
router.get("/", tenantController.getTenants);

// ادمین - مدیریت کامل
router.get("/admin/all", adminGuard, tenantController.getAllTenantsAdmin);
router.post("/", adminGuard, tenantController.createTenant);
router.put("/:id", adminGuard, tenantController.updateTenant);
router.delete("/:id", adminGuard, tenantController.deleteTenant);

module.exports = router;
