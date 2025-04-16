const db = require("../config/db");
const { sendEmail } = require("../utils/emailService");
const fs = require("fs-extra");
const path = require("path");

// Helper function to create backup directory
const createBackupDirectory = (destination, backupId) => {
  const backupDir = path.join(destination, `backup_${backupId}`);
  fs.ensureDirSync(backupDir);
  return backupDir;
};

// Helper function to perform file/folder backup
const performBackup = async (source, destination, backupType, options = {}) => {
  try {
    if (!fs.existsSync(source)) {
      throw new Error(`Source path does not exist: ${source}`);
    }

    if (!fs.existsSync(destination)) {
      fs.ensureDirSync(destination);
    }

    // Determine if source is file or directory
    const sourceStat = fs.statSync(source);

    // Handle partial backups with specific file selections
    if (backupType === "partial" && options.filePaths && options.folderPaths) {
      console.log("Processing partial backup with selections:", options);

      // Process selected files
      for (const file of options.filePaths) {
        const filePath = path.join(source, file);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          await fs.copy(filePath, path.join(destination, file));
          console.log(`Copied file: ${file}`);
        }
      }

      // Process selected folders
      for (const folder of options.folderPaths) {
        const folderPath = path.join(source, folder);
        if (
          fs.existsSync(folderPath) &&
          fs.statSync(folderPath).isDirectory()
        ) {
          const destFolder = path.join(destination, folder);
          fs.ensureDirSync(destFolder);
          await fs.copy(folderPath, destFolder, {
            overwrite: true,
            errorOnExist: false,
            recursive: true,
          });
          console.log(`Copied folder: ${folder}`);
        }
      }

      return true;
    } else if (
      (backupType === "complete" || backupType === "incremental") &&
      sourceStat.isDirectory()
    ) {
      // Copy entire directory for complete/incremental backups
      await fs.copy(source, destination, {
        overwrite: true,
        errorOnExist: false,
        recursive: true,
      });
      return true;
    } else {
      throw new Error(
        `Invalid backup type (${backupType}) for the given source`
      );
    }
  } catch (error) {
    console.error("❌ Backup operation failed:", error);
    throw error;
  }
};

// ✅ Create a backup (Manual or Scheduled)
exports.createBackup = (req, res) => {
  const {
    backupType,
    source,
    destination,
    schedule,
    filePaths,
    folderPaths,
    backupSource,
  } = req.body;
  const userId = req.user.userId;

  if (!backupType || !source || !destination) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!fs.existsSync(source)) {
    return res.status(400).json({
      message: "Invalid source path",
      error: `Source path does not exist: ${source}`
    });
  }

  // First create a record in the database
  db.query(
    "INSERT INTO backups (user_id, backup_type, source, destination, status, schedule) VALUES (?, ?, ?, ?, 'in progress', ?)",
    [userId, backupType, source, destination, schedule || "manual"],
    async (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error creating backup", error: err });
      }

      const backupId = result.insertId;

      // ✅ Log the backup creation
      db.query(
        "INSERT INTO backup_logs (user_id, backup_id, action) VALUES (?, ?, 'created')",
        [userId, backupId]
      );

      // Create the backup directory
      const backupDir = createBackupDirectory(destination, backupId);

      // ✅ If manual, process and complete immediately
      if (!schedule || schedule === "manual") {
        try {
          // Perform the actual backup
          await performBackup(source, backupDir, backupType, {
            filePaths: req.body.filePaths || [],
            folderPaths: req.body.folderPaths || [],
            backupSource: req.body.backupSource,
          });

          // Save backup metadata
          const metadata = {
            id: backupId,
            type: backupType,
            source: source,
            created: new Date().toISOString(),
            userId: userId,
          };

          fs.writeFileSync(
            path.join(backupDir, "backup-metadata.json"),
            JSON.stringify(metadata, null, 2)
          );

          // Update backup status to completed
          db.query(
            "UPDATE backups SET status = 'completed' WHERE id = ?",
            [backupId],
            (updateErr) => {
              if (updateErr) {
                console.error("❌ Error updating backup status:", updateErr);
                return res.status(500).json({
                  message: "Backup completed but status update failed",
                  backupId,
                });
              }
              console.log(`✅ Manual backup ${backupId} completed.`);

              // ✅ Send email notification after completion
              db.query(
                "SELECT email FROM users WHERE id = ?",
                [userId],
                (err, result) => {
                  if (!err && result.length > 0) {
                    const email = result[0].email;
                    sendEmail(
                      email,
                      "Backup Completed",
                      `Your manual backup (ID: ${backupId}) has been successfully completed to ${backupDir}.`
                    );
                    console.log(`📧 Email sent to ${email}`);
                  }
                }
              );
            }
          );

          // Send successful response
          return res.status(201).json({
            message: "Backup created and completed successfully",
            backupId,
            backupDir,
          });
        } catch (backupError) {
          console.error("❌ Backup operation failed:", backupError);

          // Update status to failed
          db.query(
            "UPDATE backups SET status = 'failed', error_message = ? WHERE id = ?",
            [backupError.message, backupId]
          );

          return res.status(500).json({
            message: "Backup operation failed",
            error: backupError.message,
            backupId,
          });
        }
      } else {
        // For scheduled backups, just return success as they'll be processed by cron
        return res.status(201).json({
          message: "Scheduled backup created successfully",
          backupId,
          backupDir,
        });
      }
    }
  );
};

// ✅ Retrieve backups (Admin sees all, users see their own)
exports.getBackups = (req, res) => {
  let query;
  let params = [];

  if (req.user.role === "admin") {
    query = "SELECT * FROM backups";
  } else {
    query = "SELECT * FROM backups WHERE user_id = ?";
    params.push(req.user.userId);
  }

  db.query(query, params, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving backups", error: err });
    }
    res.status(200).json({ backups: result });
  });
};

// ✅ Update backup status
exports.updateBackupStatus = (req, res) => {
  const { backupId, status } = req.body;

  if (!backupId || !status) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  db.query(
    "UPDATE backups SET status = ? WHERE id = ?",
    [status, backupId],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error updating backup status", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Backup not found" });
      }
      res.status(200).json({ message: "Backup status updated successfully" });
    }
  );
};

// ✅ Restore a backup
exports.restoreBackup = (req, res) => {
  const { backupId, restoreDestination } = req.body;
  const userId = req.user.userId;

  if (!backupId) {
    return res.status(400).json({ message: "Missing backup ID" });
  }

  db.query(
    "SELECT * FROM backups WHERE id = ?",
    [backupId],
    async (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error retrieving backup", error: err });
      if (result.length === 0)
        return res.status(404).json({ message: "Backup not found" });

      const backup = result[0];
      const backupDir = path.join(backup.destination, `backup_${backupId}`);

      if (!fs.existsSync(backupDir)) {
        return res.status(404).json({ message: "Backup files not found" });
      }

      try {
        // Determine restore destination
        const targetDir = restoreDestination || backup.source;

        // Perform the restore operation
        await fs.copy(backupDir, targetDir, {
          overwrite: true,
          errorOnExist: false,
        });

        // Log the restore action
        db.query(
          "INSERT INTO backup_logs (user_id, backup_id, action) VALUES (?, ?, 'restored')",
          [userId, backupId]
        );
        res.status(200).json({
          message: "Backup restored successfully",
          restoredTo: targetDir,
        });
      } catch (restoreError) {
        console.error("❌ Restore operation failed:", restoreError);
        return res.status(500).json({
          message: "Restore operation failed",
          error: restoreError.message,
        });
      }
    }
  );
};

// ✅ Retrieve backup logs (Admin sees all, users see their own)
exports.getBackupLogs = (req, res) => {
  let query = "SELECT * FROM backup_logs";

  if (req.user.role !== "admin") {
    query = "SELECT * FROM backup_logs WHERE user_id = ?";
  }

  db.query(query, [req.user.userId], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error retrieving logs", error: err });
    res.status(200).json({ logs: result });
  });
};

// ✅ Delete a Backup by ID
exports.deleteBackup = (req, res) => {
  const backupId = req.params.id;

  if (!backupId) {
    return res.status(400).json({ message: "Backup ID is required" });
  }

  // First get the backup record to know the location
  db.query(
    "SELECT * FROM backups WHERE id = ?",
    [backupId],
    async (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error retrieving backup", error: err });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Backup not found" });
      }

      const backup = result[0];
      const backupDir = path.join(backup.destination, `backup_${backupId}`);

      try {
        // Delete the backup files if they exist
        if (fs.existsSync(backupDir)) {
          await fs.remove(backupDir);
        }

        // Delete the database record
        db.query(
          "DELETE FROM backups WHERE id = ?",
          [backupId],
          (delErr, delResult) => {
            if (delErr) {
              return res.status(500).json({
                message: "Error deleting backup record",
                error: delErr,
              });
            }

            res.status(200).json({ message: "Backup deleted successfully" });
          }
        );
      } catch (deleteError) {
        console.error("❌ Error deleting backup files:", deleteError);
        return res.status(500).json({
          message: "Error deleting backup files",
          error: deleteError.message,
        });
      }
    }
  );
};

// ✅ Get Backup Logs (With User Email)
exports.getBackupLogsWithUser = (req, res) => {
  db.query(
    "SELECT backup_logs.*, users.email FROM backup_logs JOIN users ON backup_logs.user_id = users.id ORDER BY timestamp DESC",
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error retrieving logs", error: err });
      res.status(200).json({ logs: result });
    }
  );
};

// ✅ Fetch Scheduled Backups (for Cron Job)
exports.getScheduledBackups = (req, res) => {
  db.query(
    "SELECT * FROM backups WHERE schedule != 'manual'",
    (err, results) => {
      if (err) {
        console.error("❌ Error retrieving scheduled backups:", err);
        return res
          .status(500)
          .json({ message: "Error retrieving scheduled backups", error: err });
      }

      if (!results || results.length === 0) {
        console.log("✅ No scheduled backups found.");
        return res
          .status(200)
          .json({ message: "No scheduled backups found.", backups: [] });
      }

      res.status(200).json({ backups: results });
    }
  );
};

// ✅ Auto-create a backup (for Cron Job)
exports.autoCreateBackup = async (
  userId,
  backupType,
  source,
  destination,
  schedule,
  callback
) => {
  try {
    // Insert new backup record
    db.query(
      "INSERT INTO backups (user_id, backup_type, source, destination, status, schedule) VALUES (?, ?, ?, ?, 'in progress', ?)",
      [userId, backupType, source, destination, schedule],
      async (err, result) => {
        if (err) return callback(err);

        const backupId = result.insertId;
        const backupDir = createBackupDirectory(destination, backupId);

        try {
          // Perform the actual backup
          await performBackup(source, backupDir, backupType);

          // Save backup metadata
          const metadata = {
            id: backupId,
            type: backupType,
            source: source,
            created: new Date().toISOString(),
            userId: userId,
            schedule: schedule,
          };

          fs.writeFileSync(
            path.join(backupDir, "backup-metadata.json"),
            JSON.stringify(metadata, null, 2)
          );

          callback(null, backupId);
        } catch (backupError) {
          // Update status to failed
          db.query(
            "UPDATE backups SET status = 'failed', error_message = ? WHERE id = ?",
            [backupError.message, backupId]
          );

          callback(backupError);
        }
      }
    );
  } catch (error) {
    callback(error);
  }
};

// ✅ Get backup details by ID
exports.getBackupById = (req, res) => {
  const backupId = req.params.id;

  if (!backupId) {
    return res.status(400).json({ message: "Backup ID is required" });
  }

  db.query("SELECT * FROM backups WHERE id = ?", [backupId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving backup", error: err });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Backup not found" });
    }

    const backup = result[0];

    // Check if backup files exist
    const backupDir = path.join(backup.destination, `backup_${backupId}`);
    const backupExists = fs.existsSync(backupDir);

    // Get metadata if available
    let metadata = null;
    const metadataPath = path.join(backupDir, "backup-metadata.json");

    if (backupExists && fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      } catch (e) {
        console.error("❌ Error reading backup metadata:", e);
      }
    }

    res.status(200).json({
      backup,
      backupExists,
      backupDir: backupExists ? backupDir : null,
      metadata,
    });
  });
};

// ✅ Force run a scheduled backup
exports.forceRunScheduledBackup = (req, res) => {
  const { backupId } = req.body;

  if (!backupId) {
    return res.status(400).json({ message: "Backup ID is required" });
  }

  // Get the backup details
  db.query("SELECT * FROM backups WHERE id = ?", [backupId], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error retrieving backup", error: err });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Backup not found" });
    }

    const backup = result[0];

    // Verify it's a scheduled backup
    if (backup.schedule === 'manual') {
      return res.status(400).json({ message: "Cannot force run a manual backup" });
    }

    // Create the backup directory
    const backupDir = createBackupDirectory(backup.destination, backupId);

    try {
      // Perform the actual backup
      await performBackup(backup.source, backupDir, backup.backup_type);

      // Save backup metadata
      const metadata = {
        id: backupId,
        type: backup.backup_type,
        source: backup.source,
        created: new Date().toISOString(),
        userId: backup.user_id,
        schedule: backup.schedule,
        forceRun: true
      };

      fs.writeFileSync(
        path.join(backupDir, "backup-metadata.json"),
        JSON.stringify(metadata, null, 2)
      );

      // Update backup status to completed
      db.query(
        "UPDATE backups SET status = 'completed' WHERE id = ?",
        [backupId],
        (updateErr) => {
          if (updateErr) {
            console.error("❌ Error updating backup status:", updateErr);
          }

          // Log the force run action
          db.query(
            "INSERT INTO backup_logs (user_id, backup_id, action) VALUES (?, ?, 'force-run')",
            [backup.user_id, backupId]
          );

          console.log(`✅ Forced backup ${backupId} completed.`);

          // Send email notification
          db.query(
            "SELECT email FROM users WHERE id = ?",
            [backup.user_id],
            (emailErr, emailResult) => {
              if (!emailErr && emailResult.length > 0) {
                const email = emailResult[0].email;
                sendEmail(
                  email,
                  "Forced Backup Completed",
                  `Your scheduled backup (ID: ${backupId}) has been force-run and completed successfully to ${backupDir}.`
                );
              }
            }
          );

          return res.status(200).json({
            message: "Forced backup completed successfully",
            backupId,
            backupDir
          });
        }
      );
    } catch (backupError) {
      console.error("❌ Forced backup operation failed:", backupError);

      // Update status to failed
      db.query(
        "UPDATE backups SET status = 'failed', error_message = ? WHERE id = ?",
        [backupError.message, backupId]
      );

      return res.status(500).json({
        message: "Forced backup operation failed",
        error: backupError.message,
        backupId
      });
    }
  });
};
