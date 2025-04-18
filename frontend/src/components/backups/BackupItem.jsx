import React, { useState } from "react";

const BackupItem = ({ backup, onRestore, onDelete }) => {
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreDestination, setRestoreDestination] = useState("");
  const [deleteAfterRestore, setDeleteAfterRestore] = useState(false);

  const handleRestore = () => {
    if (!restoreDestination) {
      alert("Please enter a restore destination path");
      return;
    }
    onRestore(backup.id, restoreDestination, deleteAfterRestore);
    setShowRestoreModal(false);
    setRestoreDestination("");
    setDeleteAfterRestore(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Backup #{backup.id}
          </h3>
          <p className="text-sm text-gray-500">
            Created: {new Date(backup.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              backup.status
            )}`}
          >
            {backup.status}
          </span>
          <button
            onClick={() => setShowRestoreModal(true)}
            disabled={backup.status !== "completed"}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              backup.status === "completed"
                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Restore
          </button>
          <button
            onClick={() => onDelete(backup.id)}
            className="px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>

      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Restore Backup
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restore Destination Path
              </label>
              <input
                type="text"
                value={restoreDestination}
                onChange={(e) => setRestoreDestination(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter destination path"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deleteAfterRestore}
                  onChange={(e) => setDeleteAfterRestore(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Delete backup after restore
                </span>
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupItem;
