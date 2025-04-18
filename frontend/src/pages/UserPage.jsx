import React, { useState, useEffect } from "react";
import AppNav from "../components/layout/AppNav";
import Card from "../components/layout/Card";
import BackupList from "../components/backups/BackupList";
import BackupForm from "../components/backups/BackupForm";
import BackupFilters from "../components/backups/BackupFilters";
import {
  fetchUserData,
  fetchBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
} from "../api/backupService";

const UserPage = () => {
  // State for user data and backups
  const [userData, setUserData] = useState(null);
  const [backups, setBackups] = useState([]);
  const [filteredBackups, setFilteredBackups] = useState([]);

  // State for backup form
  const [backupType, setBackupType] = useState("complete");
  const [destination, setDestination] = useState("cloud"); // New state for destination
  const [scheduleType, setScheduleType] = useState("manual");
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [scheduleDay, setScheduleDay] = useState("Monday");
  const [scheduleMonthDay, setScheduleMonthDay] = useState(1);
  const [backupSource, setBackupSource] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);

  // New state variables for paths
  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");

  // State for filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");

  // Fetch user data and backups on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await fetchUserData();
        if (!user) {
          console.warn("⚠️ No user data found.");
          return;
        }
        setUserData(user);

        const backupsData = await fetchBackups();
        // Map backups to ensure they have an 'id' property that matches 'backupId'
        const processedBackups = (backupsData || []).map((backup) => ({
          ...backup,
          id: backup.backupId || backup.id, // Ensure each backup has an 'id' property
        }));
        setBackups(processedBackups);
        setFilteredBackups(processedBackups);
      } catch (error) {
        console.error("❌ Error loading user data:", error);
      }
    };

    loadData();
  }, []);

  // Handle backup creation
  const handleCreateBackup = async () => {
    if (!userData?.id) {
      alert("❌ Error: User data not loaded.");
      console.error("❌ User data is missing. Cannot create backup.");
      return;
    }

    // Note: We can't validate file paths in the browser
    // The backend will handle this validation

    const newBackup = {
      userId: userData.id,
      backupType: backupType,
      // Use source and destination instead of sourcePath and destinationPath
      source: sourcePath || "C:\\Users\\Default\\Documents", // Default source if not provided
      destination: destinationPath || "C:\\Users\\Default\\Backups", // Default destination if not provided
      schedule: scheduleType, // Use schedule instead of scheduleType to match backend
      backupSource: backupType === "complete" ? "all" : "selected", // Set based on backup type
      filePaths:
        backupType === "partial"
          ? selectedFiles.map((file) => file.name || file.path || String(file))
          : [],
      folderPaths:
        backupType === "partial"
          ? selectedFolders.map(
              (folder) => folder.name || folder.path || String(folder)
            )
          : [],
    };

    // Add scheduled time information based on schedule type
    if (scheduleType !== "manual") {
      newBackup.scheduledTime = {
        time:
          scheduleDate instanceof Date
            ? scheduleDate.toISOString()
            : scheduleDate,
      };

      if (scheduleType === "weekly") {
        newBackup.scheduledTime.day = scheduleDay;
      } else if (scheduleType === "monthly") {
        newBackup.scheduledTime.day = scheduleMonthDay;
      }
    }

    // Add console log to see what data is being sent
    console.log("📦 Backup data being sent:", newBackup);

    try {
      const createdBackup = await createBackup(newBackup);

      if (!createdBackup) {
        console.error("❌ Backup creation failed: API returned null");
        alert("Failed to create backup: Server returned an error");
        return;
      }

      console.log("✅ Backup created successfully:", createdBackup);

      // Add id property if it doesn't exist (to match what BackupList expects)
      const processedBackup = {
        ...createdBackup,
        id: createdBackup.backupId || createdBackup.id, // Ensure the backup has an 'id' property
      };

      // Update state with new backup
      setBackups((prev) => [...prev, processedBackup]);
      setFilteredBackups((prev) => [...prev, processedBackup]);

      // Reset form only if backup creation is successful
      setBackupType("complete");
      setDestination("cloud");
      setScheduleType("manual"); // Making sure this matches the case used elsewhere
      setScheduleDate(new Date());
      setScheduleDay("Monday");
      setScheduleMonthDay(1);
      setBackupSource("all");
      setSelectedFiles([]);
      setSelectedFolders([]);
      setSourcePath("");
      setDestinationPath("");
    } catch (error) {
      console.error("❌ Error during backup creation:", error);

      // More detailed error information
      if (error.response) {
        console.error("📄 Response data:", error.response.data);
        console.error("🔢 Response status:", error.response.status);
        alert(
          `Failed to create backup: ${
            error.response.data?.message || "Server error"
          }`
        );
      } else {
        alert("An unexpected error occurred while creating the backup.");
      }
    }
  };

  // Handle backup restoration
  const handleRestoreBackup = async (
    backupId,
    restoreDestination = "",
    deleteAfterRestore = false
  ) => {
    try {
      await restoreBackup(backupId, restoreDestination, deleteAfterRestore);

      if (deleteAfterRestore) {
        // If backup is deleted after restore, remove it from the list
        const updatedBackups = backups.filter(
          (backup) => backup.id !== backupId
        );
        setBackups(updatedBackups);
        applyFilters(updatedBackups);
      } else {
        // Otherwise just update the status
        const updatedBackups = backups.map((backup) =>
          backup.id === backupId ? { ...backup, status: "restoring" } : backup
        );
        setBackups(updatedBackups);
        applyFilters(updatedBackups);
      }
    } catch (error) {
      console.error("❌ Error restoring backup:", error);
      alert("Failed to restore backup");
    }
  };

  // Handle backup deletion
  const handleDeleteBackup = async (backupId) => {
    try {
      await deleteBackup(backupId);
      const updatedBackups = backups.filter((backup) => backup.id !== backupId);
      setBackups(updatedBackups);
      applyFilters(updatedBackups);
    } catch (error) {
      console.error("❌ Error deleting backup:", error);
      alert("Failed to delete backup");
    }
  };

  const handleFileSelection = (e) => {
    // Handle both cases - event object or array of files
    if (e && e.target && e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    } else if (Array.isArray(e)) {
      setSelectedFiles(e);
    } else {
      console.error("Invalid file selection input", e);
      setSelectedFiles([]);
    }
  };

  const handleFolderSelection = (e) => {
    // Handle both cases - event object or array of folders
    if (e && e.target && e.target.files) {
      const folders = Array.from(e.target.files);
      setSelectedFolders(folders);
    } else if (Array.isArray(e)) {
      setSelectedFolders(e);
    } else {
      console.error("Invalid folder selection input", e);
      setSelectedFolders([]);
    }
  };

  // Clear selections
  const clearSelections = () => {
    setSelectedFiles([]);
    setSelectedFolders([]);
  };

  // Apply filters to backups
  const applyFilters = (backupsToFilter = null) => {
    // Make sure we have an array to work with
    const backupsArray = Array.isArray(backupsToFilter)
      ? backupsToFilter
      : backups;

    // Ensure we're working with a fresh copy
    let filtered = [...backupsArray];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (backup) => backup && backup.status === statusFilter
      );
    }

    if (typeFilter !== "all") {
      // Use backupType instead of backup_type to match your data structure
      filtered = filtered.filter(
        (backup) =>
          backup &&
          (backup.backupType === typeFilter ||
            backup.backup_type === typeFilter)
      );
    }

    if (destinationFilter !== "all") {
      filtered = filtered.filter(
        (backup) => backup && backup.destination === destinationFilter
      );
    }
    setFilteredBackups(filtered);
  };

  return (
    <div className="user-page">
      <AppNav title="User Dashboard" />

      <div className="user-page-content">
        <Card title="Create New Backup">
          <BackupForm
            backupType={backupType}
            setBackupType={setBackupType}
            destination={destination}
            setDestination={setDestination}
            scheduleType={scheduleType}
            setScheduleType={setScheduleType}
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
            scheduleDay={scheduleDay}
            setScheduleDay={setScheduleDay}
            scheduleMonthDay={scheduleMonthDay}
            setScheduleMonthDay={setScheduleMonthDay}
            backupSource={backupSource}
            setBackupSource={setBackupSource}
            selectedFiles={selectedFiles}
            selectedFolders={selectedFolders}
            handleFileSelection={handleFileSelection}
            handleFolderSelection={handleFolderSelection}
            clearSelections={clearSelections}
            handleCreateBackup={handleCreateBackup}
            sourcePath={sourcePath}
            setSourcePath={setSourcePath}
            destinationPath={destinationPath}
            setDestinationPath={setDestinationPath}
          />
        </Card>

        <Card title="Backup Filters">
          <BackupFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            destinationFilter={destinationFilter}
            setDestinationFilter={setDestinationFilter}
            applyFilters={applyFilters}
            isAdmin={false}
          />
        </Card>

        <Card title="Backup History">
          <BackupList
            backups={filteredBackups}
            onRestore={handleRestoreBackup}
            onDelete={handleDeleteBackup}
            // We don't pass users here since we're in user view
          />
        </Card>
      </div>
    </div>
  );
};

export default UserPage;
