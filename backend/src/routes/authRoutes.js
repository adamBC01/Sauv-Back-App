const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");
const checkAdmin = require("../middleware/checkAdmin");

// ✅ Login route
router.post("/login", authController.login);

// ✅ Admin registration
router.post("/register-admin", authController.registerAdmin);

// ✅ Standard user registration via invitation
router.post("/register-user", authController.registerUser);

// ✅ Generate invitation link (admin only)
router.get(
  "/invite",
  authenticateToken,
  checkAdmin,
  authController.generateInvitation
);

// ✅ Get all users (admin only)
router.get("/users", authenticateToken, checkAdmin, authController.getAllUsers);

// ✅ Get user data (for any authenticated user)
router.get("/user-data", authenticateToken, authController.getUserData);

module.exports = router;
