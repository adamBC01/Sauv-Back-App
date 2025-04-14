import React from "react";
import ScheduleSelector from "../users/ScheduleSelector";
import FileSelector from "../backups/FileSelector";

const BackupForm = ({
  isAdmin = false,
  users = [],
  selectedUser = "",
  setSelectedUser = () => {},
  backupType,
  setBackupType,
  scheduleType,
  setScheduleType,
  scheduleDate,
  setScheduleDate,
  scheduleDay,
  setScheduleDay,
  scheduleMonthDay,
  setScheduleMonthDay,
  backupSource,
  setBackupSource,
  selectedFiles,
  selectedFolders,
  handleFileSelection,
  handleFolderSelection,
  clearSelections,
  handleCreateBackup,
  destination,
  setDestination,
}) => {
  // Handle backup type change to synchronize with backup source
  const handleBackupTypeChange = (e) => {
    const newType = e.target.value;
    setBackupType(newType);

    // Automatically set the backup source based on type
    if (newType === "complete" || newType === "incremental") {
      setBackupSource("all");
    } else if (newType === "partial") {
      setBackupSource("selected");
    }
  };

  return (
    <div className="backup-form">
      {/* Only show user selection if in admin mode and users array is provided */}
      {isAdmin && users && users.length > 0 && (
        <div className="form-group">
          <label className="form-label">User:</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="form-control"
          >
            <option value="">-- Select User --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Backup Type:</label>
        <select
          value={backupType}
          onChange={handleBackupTypeChange}
          className="form-control"
        >
          <option value="complete">Full (All Files)</option>
          <option value="incremental">
            Incremental (Changes since last backup)
          </option>
          <option value="partial">Partial (Selected Files)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Destination:</label>
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="form-control"
        >
          <option value="local">Local Storage</option>
          <option value="network">Network Drive</option>
          <option value="cloud">Cloud Storage</option>
        </select>
      </div>

      {/* Use the unified ScheduleSelector component for both admin and regular users */}
      <div className="form-group">
        <label className="form-label">Schedule:</label>
        <ScheduleSelector
          scheduleType={scheduleType}
          setScheduleType={setScheduleType}
          scheduleDate={scheduleDate}
          setScheduleDate={setScheduleDate}
          scheduleDay={scheduleDay}
          setScheduleDay={setScheduleDay}
          scheduleMonthDay={scheduleMonthDay}
          setScheduleMonthDay={setScheduleMonthDay}
        />
      </div>

      {/* Only show file selector for partial backups */}
      {backupType === "partial" && (
        <div className="form-group">
          <label className="form-label">Select Files and Folders:</label>
          <FileSelector
            backupSource={backupSource}
            setBackupSource={setBackupSource}
            selectedFiles={selectedFiles}
            selectedFolders={selectedFolders}
            handleFileSelection={handleFileSelection}
            handleFolderSelection={handleFolderSelection}
            clearSelections={clearSelections}
            hideSourceToggle={true} // Hide redundant source selection
          />
        </div>
      )}

      <button
        onClick={() => {
          // Use prepareBackupForApi from your utils before submitting
          handleCreateBackup();
        }}
        className="create-backup-button"
      >
        Create Backup
      </button>
    </div>
  );
};

export default BackupForm;