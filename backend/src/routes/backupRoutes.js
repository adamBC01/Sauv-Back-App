const express = require("express");
const router = express.Router();
const backupController = require("../controllers/backupController");
const authenticateToken = require("../middleware/authMiddleware");

// ✅ Create a backup (Manual or Scheduled)
router.post("/create", authenticateToken, backupController.createBackup);

// ✅ Get all backups (Admin sees all, users see their own)
router.get("/", authenticateToken, backupController.getBackups);

// ✅ Get backup by ID
router.get("/:id", authenticateToken, backupController.getBackupById);

// ✅ Get scheduled backups (Fixes the error)
router.get(
  "/scheduled",
  authenticateToken,
  backupController.getScheduledBackups
);

// ✅ Update backup status
router.patch(
  "/update-status",
  authenticateToken,
  backupController.updateBackupStatus
);

// ✅ Restore a backup
router.post("/restore", authenticateToken, backupController.restoreBackup);

// ✅ Get backup logs
router.get("/logs", authenticateToken, backupController.getBackupLogsWithUser);

// ✅ Delete a backup
router.delete("/:id", authenticateToken, backupController.deleteBackup);

router.post('/force-run', authenticateToken, backupController.forceRunScheduledBackup);

module.exports = router;