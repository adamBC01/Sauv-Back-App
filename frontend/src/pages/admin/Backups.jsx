import React, { useState, useEffect } from "react";
import Layout from "../../components/layout/Layout";
import Card from "../../components/layout/Card";
import {
  fetchBackups,
  fetchUsers,
  restoreBackup,
  deleteBackup,
  createBackup,
} from "../../api/backupService";
import BackupItem from "../../components/backups/BackupItem";
import BackupForm from "../../components/backups/BackupForm";

const AdminBackups = () => {
  const [backups, setBackups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for backup form
  const [backupType, setBackupType] = useState("complete");
  const [destination, setDestination] = useState("cloud");
  const [scheduleType, setScheduleType] = useState("manual");
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [scheduleDay, setScheduleDay] = useState("Monday");
  const [scheduleMonthDay, setScheduleMonthDay] = useState(1);
  const [backupSource, setBackupSource] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");

  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    user: "all",
    destination: "all",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [backupsData, usersData] = await Promise.all([
          fetchBackups(),
          fetchUsers(),
        ]);

        setBackups(backupsData || []);
        setUsers(usersData || []);
        setError(null);
      } catch (err) {
        console.error("Error loading backup data:", err);
        setError("Failed to load backup data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle backup creation
  const handleCreateBackup = async () => {
    try {
      const newBackup = {
        backupType: backupType,
        source: sourcePath || "C:\\Users\\Default\\Documents",
        destination: destinationPath || "C:\\Users\\Default\\Backups",
        schedule: scheduleType,
        backupSource: backupType === "complete" ? "all" : "selected",
        filePaths:
          backupType === "partial"
            ? selectedFiles.map(
                (file) => file.name || file.path || String(file)
              )
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

      const createdBackup = await createBackup(newBackup);

      if (!createdBackup) {
        throw new Error("Backup creation failed: Server returned null");
      }

      // Add id property if it doesn't exist
      const processedBackup = {
        ...createdBackup,
        id: createdBackup.backupId || createdBackup.id,
      };

      // Update backups list
      setBackups((prev) => [...prev, processedBackup]);

      // Reset form
      setBackupType("complete");
      setDestination("cloud");
      setScheduleType("manual");
      setScheduleDate(new Date());
      setScheduleDay("Monday");
      setScheduleMonthDay(1);
      setBackupSource("all");
      setSelectedFiles([]);
      setSelectedFolders([]);
      setSourcePath("");
      setDestinationPath("");

      alert("Backup created successfully!");
    } catch (error) {
      console.error("Error creating backup:", error);
      alert(error.message || "Failed to create backup");
    }
  };

  const handleFileSelection = (e) => {
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

  const clearSelections = () => {
    setSelectedFiles([]);
    setSelectedFolders([]);
  };

  const applyFilters = () => {
    let filtered = [...backups];

    // Filter by user
    if (filters.user !== "all") {
      filtered = filtered.filter((backup) => backup.userId === filters.user);
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((backup) => backup.status === filters.status);
    }

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter(
        (backup) => backup.backupType === filters.type
      );
    }

    // Filter by destination
    if (filters.destination !== "all") {
      filtered = filtered.filter(
        (backup) => backup.destination === filters.destination
      );
    }

    return filtered;
  };

  const handleRestoreBackup = async (
    backupId,
    restoreDestination,
    deleteAfterRestore
  ) => {
    try {
      await restoreBackup(backupId, restoreDestination, deleteAfterRestore);

      if (deleteAfterRestore) {
        // If backup is deleted after restore, remove it from the list
        const updatedBackups = backups.filter(
          (backup) => backup.id !== backupId
        );
        setBackups(updatedBackups);
      } else {
        // Otherwise just update the status
        const updatedBackups = backups.map((backup) =>
          backup.id === backupId ? { ...backup, status: "restoring" } : backup
        );
        setBackups(updatedBackups);
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      alert("Failed to restore backup");
    }
  };

  const handleDeleteBackup = async (backupId) => {
    try {
      await deleteBackup(backupId);
      const updatedBackups = backups.filter((backup) => backup.id !== backupId);
      setBackups(updatedBackups);
    } catch (error) {
      console.error("Error deleting backup:", error);
      alert("Failed to delete backup");
    }
  };

  const filteredBackups = applyFilters();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and manage backups in the system
        </p>
      </div>

      {/* Create New Backup */}
      <Card title="Create New Backup" className="mb-6">
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

      {/* Filters */}
      <Card title="Filters" className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="in-progress">In Progress</option>
              <option value="restoring">Restoring</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="type-filter"
              className="block text-sm font-medium text-gray-700"
            >
              Type
            </label>
            <select
              id="type-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="complete">Complete</option>
              <option value="partial">Partial</option>
              <option value="incremental">Incremental</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="user-filter"
              className="block text-sm font-medium text-gray-700"
            >
              User
            </label>
            <select
              id="user-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            >
              <option value="all">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="destination-filter"
              className="block text-sm font-medium text-gray-700"
            >
              Destination
            </label>
            <select
              id="destination-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.destination}
              onChange={(e) =>
                setFilters({ ...filters, destination: e.target.value })
              }
            >
              <option value="all">All Destinations</option>
              <option value="cloud">Cloud</option>
              <option value="local">Local</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Backup List */}
      <Card title="All Backups">
        <div className="space-y-4">
          {filteredBackups.map((backup) => (
            <BackupItem
              key={backup.id}
              backup={backup}
              onRestore={handleRestoreBackup}
              onDelete={handleDeleteBackup}
              user={users.find((u) => u.id === backup.userId)}
            />
          ))}
        </div>
      </Card>
    </Layout>
  );
};

export default AdminBackups;
