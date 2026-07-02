const express = require("express");
const router = express.Router();
const locationsController = require("../controllers/locations.controller");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");




router.post("/", verifyToken, requireRole("locataire", "both", "admin"), locationsController.createLocation);
router.get("/", verifyToken, locationsController.getMyLocations);


router.get("/owner", verifyToken, locationsController.getOwnerLocations);


router.get("/stats", verifyToken, locationsController.getStats);
router.get("/admin/all", verifyToken, requireRole("admin"), locationsController.getAllLocations);


router.get("/:id", verifyToken, locationsController.getLocation);
router.delete("/:id", verifyToken, locationsController.cancelLocation);


router.post("/:id/accept", verifyToken, locationsController.acceptLocation);


router.post("/:id/reject", verifyToken, locationsController.rejectLocation);


router.post("/:id/start", verifyToken, locationsController.startLocation);


router.post("/:id/return", verifyToken, locationsController.returnMateriel);

module.exports = router;
