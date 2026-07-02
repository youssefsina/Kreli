const express = require("express");
const router = express.Router();
const commissionController = require("../controllers/commission.controller");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

const adminOnly = [verifyToken, requireRole("admin")];

router.get("/", ...adminOnly, commissionController.getCommission);
router.put("/", ...adminOnly, commissionController.updateCommission);

module.exports = router;
