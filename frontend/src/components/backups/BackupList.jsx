import React from "react";
import BackupItem from "./BackupItem";
import { normalizeBackupData } from "../../utils/dataConverter";

const BackupList = ({ backups, onRestore, onDelete, users = [] }) => {
  // Ensure `backups` is always an array
  if (!Array.isArray(backups)) {
    console.error("❌ backups is not an array:", backups);
    backups = []; // Default to an empty array
  }

  // Normalize all backup data
  const normalizedBackups = backups.map(backup =>
    backup ? normalizeBackupData(backup) : null
  );

  return (
    <div className="backup-list">
      {normalizedBackups.length === 0 ? (
        <p className="no-backups">No backups available.</p>
      ) : (
        normalizedBackups.map((backup) =>
          backup ? (
            <BackupItem
              key={backup.id}
              backup={backup}
              onRestore={onRestore}
              onDelete={onDelete}
              users={users}
            />
          ) : null
        )
      )}
    </div>
  );
};

export default BackupList;