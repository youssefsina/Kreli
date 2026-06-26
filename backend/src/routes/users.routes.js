const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");




router.get("/me", verifyToken, usersController.getProfile);
router.put("/me", verifyToken, ...usersController.updateProfile);
router.put("/me/password", verifyToken, ...usersController.changePassword);
router.delete("/me", verifyToken, ...usersController.deleteAccount);


router.get("/stats/admin", verifyToken, requireRole("admin"), usersController.getAdminStats);
router.get("/stats/owner", verifyToken, usersController.getOwnerStats);


router.get("/stats/locataire", verifyToken, usersController.getLocataireStats);


router.get("/me/favoris", verifyToken, usersController.getFavoris);
router.post("/me/favoris/:materielId", verifyToken, usersController.toggleFavori);


router.get("/", verifyToken, requireRole("admin"), usersController.getAllUsers);


router.get("/:id", verifyToken, usersController.getUser);


router.patch("/:id/status", verifyToken, requireRole("admin"), usersController.updateUserStatus);

module.exports = router;
