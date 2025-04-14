const express = require("express");
const router = express.Router();
const inviteController = require("../controllers/inviteController");
const authenticateToken = require("../middleware/authMiddleware");
const checkAdmin = require("../middleware/checkAdmin");

// ✅ Generate Invitation Link (Admin Only)
router.get("/invite", authenticateToken, checkAdmin, inviteController.generateInvitation);

// ✅ Verify Invitation Token (Updated Route for URL-based verification)
router.get("/verify/:token", inviteController.verifyInvite);

module.exports = router;
