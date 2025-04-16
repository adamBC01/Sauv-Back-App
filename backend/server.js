const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./src/config/db");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const { sendEmail } = require("./src/utils/emailService");
const backupController = require("./src/controllers/backupController");
const fs = require("fs-extra");
const path = require("path");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const backupRoutes = require("./src/routes/backupRoutes");
const inviteRoutes = require("./src/routes/inviteRoutes");

dotenv.config();
const app = express();

// Configure middleware with limits
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

// Add request timeouts
app.use((req, res, next) => {
  req.setTimeout(60000); // 60 second timeout for requests
  res.setTimeout(60000);
  next();
});

// Configure routes
app.use("/api/auth", authRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/invite", inviteRoutes);

// Establish database connection with error handling
const connectDB = () => {
  return new Promise((resolve, reject) => {
    // Check if db has a connect method, otherwise assume it's already connected
    if (typeof db.connect === "function") {
      db.connect((err) => {
        if (err) {
          console.error("❌ Failed to connect to database:", err);
          reject(err);
        } else {
          console.log("✅ Connected to database successfully");
          resolve();
        }
      });
    } else {
      // Perform a test query to verify connection
      db.query("SELECT 1", (err) => {
        if (err) {
          console.error("❌ Database connection test failed:", err);
          reject(err);
        } else {
          console.log("✅ Database connection verified");
          resolve();
        }
      });
    }
  });
};

// Concurrent backup processing with better error handling
const processBackup = async (backup) => {
  try {
    const backupDir = path.join(backup.destination, `backup_${backup.id}`);

    // Create backup directory if it doesn't exist
    fs.ensureDirSync(backupDir);

    console.log(
      `📁 Processing backup ${backup.id} from ${backup.source} to ${backupDir}`
    );

    // Check if source exists before attempting backup
    if (!fs.existsSync(backup.source)) {
      throw new Error(`Source path ${backup.source} does not exist`);
    }

    // Determine if source is file or directory
    const sourceStat = fs.statSync(backup.source);

    if (backup.backup_type === "file" && sourceStat.isFile()) {
      // Copy single file
      await fs.copy(
        backup.source,
        path.join(backupDir, path.basename(backup.source))
      );
    } else if (backup.backup_type === "folder" && sourceStat.isDirectory()) {
      // Copy entire directory
      await fs.copy(backup.source, backupDir, {
        overwrite: true,
        errorOnExist: false,
        recursive: true,
      });
    } else {
      throw new Error(
        `Invalid backup type (${backup.backup_type}) for the given source`
      );
    }

    // Save backup metadata
    const metadata = {
      id: backup.id,
      type: backup.backup_type,
      source: backup.source,
      created: new Date().toISOString(),
      userId: backup.user_id,
      schedule: backup.schedule,
    };

    fs.writeFileSync(
      path.join(backupDir, "backup-metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    // Update status to 'completed'
    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE backups SET status = 'completed' WHERE id = ?",
        [backup.id],
        (err) => {
          if (err) {
            console.error(`❌ Error completing backup ${backup.id}:`, err);
            reject(err);
          } else {
            console.log(`✅ Backup ${backup.id} completed.`);
            resolve();
          }
        }
      );
    });

    // Send email notification after completion
    db.query(
      "SELECT email FROM users WHERE id = ?",
      [backup.user_id],
      (err, result) => {
        if (err) {
          console.error(
            `❌ Error fetching user email for backup ${backup.id}:`,
            err
          );
          return;
        }

        if (result.length > 0) {
          const email = result[0].email;
          sendEmail(
            email,
            "Backup Completed",
            `Your scheduled backup (ID: ${backup.id}) has been successfully completed to ${backupDir}.`
          ).catch((err) => {
            console.error(
              `❌ Error sending completion email for backup ${backup.id}:`,
              err
            );
          });
          console.log(`📧 Email sent to ${email}`);
        }
      }
    );

    return true;
  } catch (backupError) {
    console.error(`❌ Error processing backup ${backup.id}:`, backupError);

    // Update status to 'failed'
    try {
      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE backups SET status = 'failed', error_message = ? WHERE id = ?",
          [backupError.message, backup.id],
          (err) => {
            if (err) {
              console.error(
                `❌ Error updating status for backup ${backup.id}:`,
                err
              );
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    } catch (updateErr) {
      console.error(
        `❌ Failed to update backup status for ${backup.id}:`,
        updateErr
      );
    }

    // Send failure notification
    try {
      await new Promise((resolve, reject) => {
        db.query(
          "SELECT email FROM users WHERE id = ?",
          [backup.user_id],
          (err, result) => {
            if (err) {
              console.error(
                `❌ Error fetching user email for failure notification (backup ${backup.id}):`,
                err
              );
              reject(err);
            } else if (result.length > 0) {
              const email = result[0].email;
              sendEmail(
                email,
                "Backup Failed",
                `Your scheduled backup (ID: ${backup.id}) has failed. Error: ${backupError.message}`
              ).catch((emailErr) => {
                console.error(
                  `❌ Error sending failure email for backup ${backup.id}:`,
                  emailErr
                );
              });
              resolve();
            } else {
              resolve();
            }
          }
        );
      });
    } catch (emailErr) {
      console.error(
        `❌ Failed to notify user about backup failure (backup ${backup.id}):`,
        emailErr
      );
    }

    return false;
  }
};

// Improved cron job with better frequency and concurrency control
cron.schedule(
  "*/5 * * * *",
  async () => {
    console.log("🕒 Running scheduled backup check...");

    // Use a flag to prevent overlapping cron executions
    if (global.isBackupJobRunning) {
      console.log("⏱️ Previous backup job still running, skipping this run");
      return;
    }

    global.isBackupJobRunning = true;

    try {
      // Fetch only pending scheduled backups
      const backups = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM backups WHERE schedule != 'manual' AND status = 'in progress' LIMIT 10",
          (err, results) => {
            if (err) {
              console.error("❌ Error fetching scheduled backups:", err);
              reject(err);
            } else {
              resolve(results);
            }
          }
        );
      });

      // Only log when backups are found
      if (backups.length === 0) {
        console.log("💤 No pending scheduled backups found");
        global.isBackupJobRunning = false;
        return;
      }

      console.log(`🚀 Found ${backups.length} scheduled backup(s) to process.`);

      // Process backups with concurrency limit
      const CONCURRENCY_LIMIT = 3;
      const chunks = [];

      // Split backups into chunks of CONCURRENCY_LIMIT
      for (let i = 0; i < backups.length; i += CONCURRENCY_LIMIT) {
        chunks.push(backups.slice(i, i + CONCURRENCY_LIMIT));
      }

      // Process each chunk of backups concurrently
      for (const chunk of chunks) {
        await Promise.all(chunk.map((backup) => processBackup(backup)));
      }
    } catch (error) {
      console.error("❌ Cron job failed:", error);
    } finally {
      global.isBackupJobRunning = false;
      console.log("✅ Scheduled backup check completed");
    }
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);

// Add global error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error in request:", err);
  res
    .status(500)
    .json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

// Process-level error handling
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
  // Log the error but don't exit in production to maintain uptime
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled rejection at:", promise, "reason:", reason);
});

// Start server with database connection check
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app
      .listen(PORT, () => {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
      })
      .on("error", (err) => {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
      });
  } catch (err) {
    console.error(
      "❌ Failed to start server due to database connection error:",
      err
    );
    process.exit(1);
  }
}

startServer();
