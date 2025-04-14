import React from "react";

const BackupItem = ({ backup, onRestore, onDelete, users = [] }) => {
  // Ensure backup and users are valid
  if (!backup) {
    console.error("❌ Invalid backup object");
    return null;
  }

  // Find user information - Using normalized userId
  const user = users.find(user => user.id === backup.userId);
  const userEmail = user ? user.email : "Unknown User";

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      console.error("❌ Date formatting error:", error);
      return "Invalid Date";
    }
  };

  return (
    <div className="backup-item">
      <div className="backup-details">
        <div className="backup-header">
          <h3>Backup #{backup.id} - {backup.backupType || "Unknown"} Backup</h3>
          <span className={`status status-${backup.status.toLowerCase()}`}>
            {backup.status || "Unknown"}
          </span>
        </div>
        <div className="backup-info">
          {/* Only show user email in admin view (when users array is provided and has items) */}
          {users && users.length > 0 && (
            <p><strong>User:</strong> {userEmail}</p>
          )}
          <p><strong>Created:</strong> {formatDate(backup.createdAt)}</p>
          <p><strong>Type:</strong> {backup.backupType || "Unknown"}</p>
          <p><strong>Destination:</strong> {backup.destination || "Unknown"}</p>
          {backup.size && <p><strong>Size:</strong> {backup.size}</p>}
          {backup.completedAt && (
            <p><strong>Completed:</strong> {formatDate(backup.completedAt)}</p>
          )}
        </div>
      </div>
      <div className="action-buttons">
        {backup.status !== "restoring" && (
          <button
            className="restore-btn"
            onClick={() => onRestore(backup.id)}
            disabled={backup.status === "in-progress"}
          >
            Restore
          </button>
        )}
        <button
          className="delete-btn"
          onClick={() => onDelete(backup.id)}
          disabled={backup.status === "in-progress" || backup.status === "restoring"}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default BackupItem;