// src/utils/dataConverter.js

/**
 * Normalizes backup data between frontend and backend formats
 * Handles inconsistencies in property names and values
 */
export const normalizeBackupData = (backupData) => {
  // Ensure we have an ID property that's consistent
  const id = backupData.id || backupData.backupId || backupData._id;

  // Normalize backup type
  let backupType = backupData.backupType || backupData.backup_type;
  if (backupType === "folder" || backupType === "file") {
    // Convert backend types to frontend types
    backupType = convertBackendTypeToFrontend(backupType, backupData);
  }

  return {
    id: id,
    backupId: id,
    userId: backupData.userId || backupData.user_id,
    status: backupData.status || "pending",
    backupType: backupType,
    destination: backupData.destination,
    source: backupData.source,
    schedule: backupData.schedule,
    createdAt: backupData.createdAt || backupData.created_at || new Date().toISOString(),
    // Include other properties as needed
  };
};

/**
 * Converts backend backup types to frontend format
 */
const convertBackendTypeToFrontend = (backendType, backupData) => {
  // Try to determine the frontend backup type based on backend data
  // You may need additional metadata from the backend to determine if it's incremental

  // Using metadata if available
  if (backupData.metadata) {
    try {
      const metadata = typeof backupData.metadata === 'string'
        ? JSON.parse(backupData.metadata)
        : backupData.metadata;

      if (metadata.backupType) {
        return metadata.backupType; // Use explicit type from metadata
      }

      if (metadata.incremental === true) {
        return "incremental";
      }

      if (Array.isArray(metadata.files) || Array.isArray(metadata.folders)) {
        return "partial";
      }
    } catch (e) {
      console.warn("Could not parse backup metadata", e);
    }
  }

  // Fallback logic based on backup_type
  if (backendType === "file") {
    return "partial"; // Assume partial for individual files
  }

  return "complete"; // Default to complete backup for folders
};

/**
 * Prepares backup data from frontend form for backend API
 */
export const prepareBackupForApi = (formData) => {
  const {
    userId,
    backupType,
    destination,
    scheduleType,
    scheduleDate,
    scheduleDay,
    scheduleMonthDay,
    selectedFiles,
    selectedFolders
  } = formData;

  // Calculate source path based on selections
  let source = "";
  if (backupType === "partial" && (selectedFiles.length > 0 || selectedFolders.length > 0)) {
    // For partial backups, we'll use the first selected item as the source
    source = selectedFiles.length > 0
      ? (selectedFiles[0].path || selectedFiles[0].name)
      : (selectedFolders[0].path || selectedFolders[0].name);
  } else {
    // For complete/incremental backups, we need a default source directory
    source = "C:\\Users\\Default\\Documents"; // This should be configurable
  }

  // Determine backend backup_type
  const backendType = backupType === "partial" && selectedFiles.length > 0 && selectedFolders.length === 0
    ? "file"
    : "folder";

  // Prepare schedule information
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

  // Create metadata to store frontend-specific information
  const metadata = {
    backupType: backupType,
    files: backupType === "partial" ? selectedFiles.map(f => f.path || f.name) : [],
    folders: backupType === "partial" ? selectedFolders.map(f => f.path || f.name) : [],
    incremental: backupType === "incremental"
  };

  // Return backend-compatible object
  return {
    userId: userId,
    user_id: userId, // Include both formats to be safe
    backup_type: backendType,
    backupType: backendType, // Include both formats to be safe
    source: source,
    destination: destination,
    schedule: scheduleType.toLowerCase(),
    scheduledTime: scheduledTime,
    metadata: JSON.stringify(metadata)
  };
};

/**
 * Helper function to process file objects from file input
 */
export const processFileSelection = (fileList) => {
  return Array.from(fileList).map(file => ({
    name: file.name,
    path: file.webkitRelativePath || file.path || file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  }));
};

/**
 * Helper function to process folder selection
 */
export const processFolderSelection = (fileList) => {
  // Group files by directory
  const filesByDirectory = {};

  Array.from(fileList).forEach(file => {
    const path = file.webkitRelativePath;
    if (path) {
      const parts = path.split('/');
      if (parts.length > 1) {
        const folderName = parts[0];
        if (!filesByDirectory[folderName]) {
          filesByDirectory[folderName] = [];
        }
        filesByDirectory[folderName].push(file);
      }
    }
  });

  // Create folder objects
  return Object.keys(filesByDirectory).map(folderName => ({
    name: folderName,
    path: folderName, // This would need to be expanded for real paths
    files: filesByDirectory[folderName],
    size: filesByDirectory[folderName].reduce((total, file) => total + file.size, 0),
    fileCount: filesByDirectory[folderName].length
  }));
};