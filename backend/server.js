const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./src/config/db");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const { sendEmail } = require("./src/utils/emailService"); // ✅ Import email service
const backupController = require("./src/controllers/backupController");
const fs = require('fs-extra');
const path = require('path');

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const backupRoutes = require("./src/routes/backupRoutes");
const inviteRoutes = require("./src/routes/inviteRoutes");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/invite", inviteRoutes);

// ✅ Cron job to check and process scheduled backups
cron.schedule("* * * * *", async () => {
    try {
        // Fetch only pending scheduled backups
        db.query(
            "SELECT * FROM backups WHERE schedule != 'manual' AND status = 'in progress'",
            async (err, backups) => {
                if (err) {
                    console.error("❌ Error fetching scheduled backups:", err);
                    return;
                }

                // Only log when backups are found
                if (backups.length === 0) return;

                console.log(`🚀 Found ${backups.length} scheduled backup(s) to process.`);

                for (const backup of backups) {
                    try {
                        const backupDir = path.join(backup.destination, `backup_${backup.id}`);

                        // Create backup directory if it doesn't exist
                        fs.ensureDirSync(backupDir);

                        console.log(`📁 Processing backup ${backup.id} from ${backup.source} to ${backupDir}`);

                        // Determine if source is file or directory
                        const sourceStat = fs.statSync(backup.source);

                        if (backup.backup_type === 'file' && sourceStat.isFile()) {
                            // Copy single file
                            await fs.copy(backup.source, path.join(backupDir, path.basename(backup.source)));
                        } else if (backup.backup_type === 'folder' && sourceStat.isDirectory()) {
                            // Copy entire directory
                            await fs.copy(backup.source, backupDir, {
                                overwrite: true,
                                errorOnExist: false,
                                recursive: true
                            });
                        } else {
                            throw new Error(`Invalid backup type (${backup.backup_type}) for the given source`);
                        }

                        // Save backup metadata
                        const metadata = {
                            id: backup.id,
                            type: backup.backup_type,
                            source: backup.source,
                            created: new Date().toISOString(),
                            userId: backup.user_id,
                            schedule: backup.schedule
                        };

                        fs.writeFileSync(
                            path.join(backupDir, 'backup-metadata.json'),
                            JSON.stringify(metadata, null, 2)
                        );

                        // Update status to 'completed'
                        await new Promise((resolve, reject) => {
                            db.query(
                                "UPDATE backups SET status = 'completed' WHERE id = ?",
                                [backup.id],
                                (err) => {
                                    if (err) {
                                        console.error("❌ Error completing backup:", err);
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
                                if (!err && result.length > 0) {
                                    const email = result[0].email;
                                    sendEmail(
                                        email,
                                        "Backup Completed",
                                        `Your scheduled backup (ID: ${backup.id}) has been successfully completed to ${backupDir}.`
                                    );
                                    console.log(`📧 Email sent to ${email}`);
                                }
                            }
                        );
                    } catch (backupError) {
                        console.error("❌ Error processing backup:", backupError);

                        // Update status to 'failed'
                        db.query(
                            "UPDATE backups SET status = 'failed', error_message = ? WHERE id = ?",
                            [backupError.message, backup.id],
                            (err) => {
                                if (err) {
                                    console.error("❌ Error updating backup status:", err);
                                }
                            }
                        );

                        // Send failure notification
                        db.query(
                            "SELECT email FROM users WHERE id = ?",
                            [backup.user_id],
                            (err, result) => {
                                if (!err && result.length > 0) {
                                    const email = result[0].email;
                                    sendEmail(
                                        email,
                                        "Backup Failed",
                                        `Your scheduled backup (ID: ${backup.id}) has failed. Error: ${backupError.message}`
                                    );
                                }
                            }
                        );
                    }
                }
            }
        );
    } catch (error) {
        console.error("❌ Cron job failed:", error);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});