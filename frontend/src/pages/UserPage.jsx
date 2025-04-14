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
import "./UserPage.css";

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

    const newBackup = {
      userId: userData.id,
      backupType: backupType,
      destination: destination,
      backupSource: backupType === "complete" ? "all" : "selected", // Set based on backup type
      filePaths:
        backupType === "partial"
          ? selectedFiles.map((file) => file.name)
          : [],
      folderPaths:
        backupType === "partial"
          ? selectedFolders.map((folder) => folder.name)
          : [],
    };

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
      setScheduleType("Manual");
      setScheduleDate(new Date());
      setScheduleDay("Monday");
      setScheduleMonthDay(1);
      setBackupSource("all");
      setSelectedFiles([]);
      setSelectedFolders([]);
    } catch (error) {
      console.error("❌ Error during backup creation:", error);
      alert("An unexpected error occurred while creating the backup.");
    }
  };

  // Handle backup restoration
  const handleRestoreBackup = async (backupId) => {
    try {
      await restoreBackup(backupId);
      const updatedBackups = backups.map((backup) =>
        backup.id === backupId ? { ...backup, status: "restoring" } : backup
      );
      setBackups(updatedBackups);
      applyFilters(updatedBackups);
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

  // Handle file selection
  const handleFileSelection = (files) => {
    setSelectedFiles(files);
  };

  // Handle folder selection
  const handleFolderSelection = (folders) => {
    setSelectedFolders(folders);
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
