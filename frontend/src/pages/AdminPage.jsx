import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminPage.css";

// Layout Components
import AppNav from "../components/layout/AppNav";
import Card from "../components/layout/Card";

// Admin Components
import UserList from "../components/users/UserList";
import InviteGenerator from "../components/users/InviteGenerator";

// Backup Components
import BackupForm from "../components/backups/BackupForm";
import BackupList from "../components/backups/BackupList";
import BackupFilters from "../components/backups/BackupFilters";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [filteredBackups, setFilteredBackups] = useState([]);

  // Form states
  const [selectedUser, setSelectedUser] = useState("");
  const [backupType, setBackupType] = useState("complete");
  const [destination, setDestination] = useState("cloud");
  const [scheduleType, setScheduleType] = useState("manual");
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [scheduleDay, setScheduleDay] = useState("Monday");
  const [scheduleMonthDay, setScheduleMonthDay] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [backupSource, setBackupSource] = useState("all");

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");

  const navigate = useNavigate();

  // Move this above the useEffect
  const applyFilters = useCallback(() => {
    let filtered = [...backups];

    // Filter by user
    if (userFilter !== "all") {
      filtered = filtered.filter((backup) => backup.userId === userFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((backup) => backup.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((backup) => backup.backupType === typeFilter);
    }

    // Filter by destination
    if (destinationFilter !== "all") {
      filtered = filtered.filter(
        (backup) => backup.destination === destinationFilter
      );
    }

    setFilteredBackups(filtered);
  }, [backups, statusFilter, typeFilter, userFilter, destinationFilter]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "admin") {
      navigate("/");
      return;
    }

    fetchUsers();
    fetchBackups();
  }, [navigate]);

  // Then use it in useEffect
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Initialize filteredBackups with all backups when backups change
  useEffect(() => {
    setFilteredBackups(backups);
  }, [backups]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/backups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBackups(response.data.backups);
    } catch (error) {
      console.error("Error fetching backups:", error);
    }
  };

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleFolderSelection = (e) => {
    const folders = Array.from(e.target.files);
    setSelectedFolders(folders);
  };

  const clearSelections = () => {
    setSelectedFiles([]);
    setSelectedFolders([]);
  };

  const handleCreateBackup = async () => {
    if (!selectedUser) {
      alert("Please select a user.");
      return;
    }

    let scheduledTime = null;
    if (scheduleType !== "manual") {
      if (scheduleType === "daily") {
        scheduledTime = scheduleDate;
      } else if (scheduleType === "weekly") {
        scheduledTime = { day: scheduleDay, time: scheduleDate };
      } else if (scheduleType === "monthly") {
        scheduledTime = { day: scheduleMonthDay, time: scheduleDate };
      }
    }

    // Prepare file and folder paths - only needed for partial backups
    const filePaths =
      backupType === "partial"
        ? selectedFiles.map((file) => file.path || file.name)
        : [];
    const folderPaths =
      backupType === "partial"
        ? selectedFolders.map((folder) => folder.path || folder.name)
        : [];

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/backups/create",
        {
          userId: selectedUser,
          backupType,
          destination,
          schedule: scheduleType,
          scheduledTime,
          backupSource: backupType === "complete" ? "all" : "selected", // Set based on backup type
          filePaths: backupType === "partial" ? filePaths : [],
          folderPaths: backupType === "partial" ? folderPaths : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Backup created successfully!");
      fetchBackups();
      if (backupType === "partial") {
        clearSelections();
      }
    } catch (error) {
      alert("Failed to create backup.");
      console.error("Error creating backup:", error);
    }
  };

  const restoreBackup = async (backupId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/backups/restore",
        { backupId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Backup restored successfully!");
      fetchBackups();
    } catch (error) {
      alert("Failed to restore backup.");
      console.error("Error restoring backup:", error);
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/backups/${backupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Backup deleted successfully!");
      fetchBackups();
    } catch (error) {
      alert("Failed to delete backup.");
      console.error("Error deleting backup:", error);
    }
  };

  return (
    <div className="admin-container">
      <AppNav title="Admin Dashboard" />

      <div className="admin-content">
        {/* User Management Section */}
        <Card title="User Management">
          <UserList users={users} />
        </Card>

        {/* Invite Standard User Section */}
        <Card title="Invite Standard User">
          <InviteGenerator />
        </Card>

        {/* Backup Creation Section */}
        <Card title="Backup Creation">
          <BackupForm
            users={users}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
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

        {/* Backup Filters Section */}
        <Card title="Backup Filters">
          <BackupFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            destinationFilter={destinationFilter}
            setDestinationFilter={setDestinationFilter}
            userFilter={userFilter}
            setUserFilter={setUserFilter}
            users={users}
            applyFilters={applyFilters}
            isAdmin={true}
          />
        </Card>

        {/* Backup History Section */}
        <Card title="Backup History">
          <BackupList
            backups={filteredBackups}
            onRestore={restoreBackup}
            onDelete={deleteBackup}
            users={users} // Pass the users array to display emails
          />
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
