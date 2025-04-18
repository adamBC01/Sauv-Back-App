// src/api/backupService.jsx
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ✅ Fetch all users (Admin only)
export const fetchUsers = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("❌ No auth token found! Redirecting to login.");
      return [];
    }

    const response = await axios.get(`${API_BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return [];
  }
};

// ✅ Fetch user data (for a normal user)
export const fetchUserData = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("❌ No token found! Redirecting to login.");
      return null;
    }

    const response = await axios.get(`${API_BASE_URL}/auth/user-data`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user data:", error);
    return null;
  }
};

// ✅ Fetch all backups
export const fetchBackups = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("❌ No token found! Redirecting to login.");
      return [];
    }

    const response = await axios.get(`${API_BASE_URL}/backups`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.backups || []; // Ensure it always returns an array
  } catch (error) {
    console.error(
      "❌ Error fetching backups:",
      error.response?.data || error.message
    );
    return []; // Return an empty array to avoid crashing
  }
};

// ✅ Create a new backup
export const createBackup = async (backupData) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("❌ No token found! Redirecting to login.");
      return null;
    }

    // Log the backup data being sent for debugging
    console.log("📦 Sending backup data to API:", backupData);

    const response = await axios.post(
      `${API_BASE_URL}/backups/create`,
      backupData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Log the response for debugging
    console.log("✅ Backup creation response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error creating backup:",
      error.response?.data || error.message
    );

    // Provide more detailed error information
    if (error.response) {
      console.error("📄 Response data:", error.response.data);
      console.error("🔢 Response status:", error.response.status);
    }

    throw error; // Re-throw the error so the caller can handle it
  }
};

// ✅ Restore a backup
export const restoreBackup = async (
  backupId,
  restoreDestination = "",
  deleteAfterRestore = false
) => {
  try {
    const token = localStorage.getItem("token");

    // Corrected endpoint - using /restore endpoint with backupId in request body
    const response = await axios.post(
      `${API_BASE_URL}/backups/restore`,
      {
        backupId,
        restoreDestination,
        deleteAfterRestore,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error restoring backup:", error);
    throw error;
  }
};

// ✅ Delete a backup
export const deleteBackup = async (backupId) => {
  try {
    const token = localStorage.getItem("token");

    await axios.delete(`${API_BASE_URL}/backups/${backupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return true;
  } catch (error) {
    console.error("❌ Error deleting backup:", error);
    throw error;
  }
};
