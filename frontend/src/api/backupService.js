import axios from "axios";

// API base URL - adjust this to match your backend URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Function to get the authentication token from localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Mock data for development
const mockUsers = [
  { id: 1, name: "Admin User", email: "admin@example.com", role: "admin" },
  { id: 2, name: "Regular User", email: "user@example.com", role: "user" },
];

const mockBackups = [
  {
    id: 1,
    userId: 1,
    status: "completed",
    backupType: "complete",
    destination: "cloud",
    createdAt: new Date().toISOString(),
    size: "1.2 GB",
  },
  {
    id: 2,
    userId: 2,
    status: "in_progress",
    backupType: "partial",
    destination: "local",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    size: "500 MB",
  },
  {
    id: 3,
    userId: 1,
    status: "failed",
    backupType: "complete",
    destination: "cloud",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    size: "2.1 GB",
  },
];

// Flag to use mock data instead of real API calls
const USE_MOCK_DATA = true;

// User related functions
export const fetchUserData = async () => {
  if (USE_MOCK_DATA) {
    // Return the first user as the current user
    return mockUsers[0];
  }

  try {
    const response = await axios.get(`${API_URL}/users/me`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Return mock data on error
    return mockUsers[0];
  }
};

export const updateUserData = async (userData) => {
  if (USE_MOCK_DATA) {
    // Simulate successful update
    console.log("Mock update user data:", userData);
    return { ...userData, updated: true };
  }

  try {
    const response = await axios.put(
      `${API_URL}/users/${userData.id}`,
      userData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

export const fetchUsers = async () => {
  if (USE_MOCK_DATA) {
    return mockUsers;
  }

  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return mock data on error
    return mockUsers;
  }
};

// Backup related functions
export const fetchBackups = async () => {
  if (USE_MOCK_DATA) {
    return mockBackups;
  }

  try {
    const response = await axios.get(`${API_URL}/backups`);
    return response.data;
  } catch (error) {
    console.error("Error fetching backups:", error);
    // Return mock data on error
    return mockBackups;
  }
};

export const createBackup = async (backupData) => {
  if (USE_MOCK_DATA) {
    // Simulate successful creation
    const newBackup = {
      id: mockBackups.length + 1,
      ...backupData,
      status: "in_progress",
      createdAt: new Date().toISOString(),
      size: "0 MB",
    };
    mockBackups.push(newBackup);
    return newBackup;
  }

  try {
    const response = await axios.post(`${API_URL}/backups`, backupData);
    return response.data;
  } catch (error) {
    console.error("Error creating backup:", error);
    throw error;
  }
};

export const restoreBackup = async (
  backupId,
  destination,
  deleteAfterRestore = false
) => {
  if (USE_MOCK_DATA) {
    // Simulate successful restore
    console.log("Mock restore backup:", {
      backupId,
      destination,
      deleteAfterRestore,
    });

    if (deleteAfterRestore) {
      const index = mockBackups.findIndex((b) => b.id === backupId);
      if (index !== -1) {
        mockBackups.splice(index, 1);
      }
    } else {
      const backup = mockBackups.find((b) => b.id === backupId);
      if (backup) {
        backup.status = "restoring";
      }
    }

    return { success: true };
  }

  try {
    const response = await axios.post(
      `${API_URL}/backups/${backupId}/restore`,
      {
        destination,
        deleteAfterRestore,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error restoring backup:", error);
    throw error;
  }
};

export const deleteBackup = async (backupId) => {
  if (USE_MOCK_DATA) {
    // Simulate successful deletion
    console.log("Mock delete backup:", backupId);
    const index = mockBackups.findIndex((b) => b.id === backupId);
    if (index !== -1) {
      mockBackups.splice(index, 1);
    }
    return { success: true };
  }

  try {
    const response = await axios.delete(`${API_URL}/backups/${backupId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting backup:", error);
    throw error;
  }
};

// User invitation function
export const generateInviteLink = async () => {
  try {
    if (USE_MOCK_DATA) {
      // Mock response for development
      const mockToken = Math.random().toString(36).substr(2, 8);
      return {
        invitationLink: `http://localhost:3000/invite?token=${mockToken}`,
      };
    }

    // Use the correct API endpoint URL
    const response = await fetch(`${API_URL}/auth/invite`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to generate invite link");
    }

    const data = await response.json();
    console.log("Invitation link response:", data);
    return data;
  } catch (error) {
    console.error("Error generating invite link:", error);
    throw error;
  }
};
