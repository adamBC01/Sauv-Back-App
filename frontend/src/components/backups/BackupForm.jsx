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
  // Add these new props
  sourcePath,
  setSourcePath,
  destinationPath,
  setDestinationPath,
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-6">
        {/* Step 1: User Selection (Admin only) */}
        {isAdmin && users && users.length > 0 && (
          <div className="form-section">
            <div className="flex items-center mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-medium text-sm mr-3">
                1
              </span>
              <h3 className="text-lg font-medium text-gray-900">Select User</h3>
            </div>
            <div className="ml-11">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">-- Select User --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Backup Type Selection */}
        <div className="form-section">
          <div className="flex items-center mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-medium text-sm mr-3">
              {isAdmin ? "2" : "1"}
            </span>
            <h3 className="text-lg font-medium text-gray-900">
              Select Backup Type
            </h3>
          </div>
          <div className="ml-11">
            <select
              value={backupType}
              onChange={handleBackupTypeChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="complete">Full (All Files)</option>
              <option value="incremental">
                Incremental (Changes since last backup)
              </option>
              <option value="partial">Partial (Selected Files)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {backupType === "complete" &&
                "Backs up all files in the selected directory"}
              {backupType === "incremental" &&
                "Backs up only files that have changed since the last backup"}
              {backupType === "partial" &&
                "Backs up only the files and folders you select"}
            </p>
          </div>
        </div>

        {/* Step 3: Source Selection */}
        <div className="form-section">
          <div className="flex items-center mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-medium text-sm mr-3">
              {isAdmin ? "3" : "2"}
            </span>
            <h3 className="text-lg font-medium text-gray-900">Select Source</h3>
          </div>
          <div className="ml-11">
            {backupType === "partial" ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <FileSelector
                  backupSource={backupSource}
                  setBackupSource={setBackupSource}
                  selectedFiles={selectedFiles}
                  selectedFolders={selectedFolders}
                  handleFileSelection={handleFileSelection}
                  handleFolderSelection={handleFolderSelection}
                  clearSelections={clearSelections}
                  hideSourceToggle={true}
                />
              </div>
            ) : (
              <div className="flex">
                <input
                  type="text"
                  value={sourcePath || ""}
                  onChange={(e) => setSourcePath(e.target.value)}
                  placeholder="Enter source directory path"
                  className="flex-1 rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => {
                    // This would need to be implemented with a directory browser
                    // For now it's just a placeholder
                    alert("Directory browser would open here");
                  }}
                >
                  Browse
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Destination Selection */}
        <div className="form-section">
          <div className="flex items-center mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-medium text-sm mr-3">
              {isAdmin ? "4" : "3"}
            </span>
            <h3 className="text-lg font-medium text-gray-900">
              Select Destination
            </h3>
          </div>
          <div className="ml-11">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
              <div
                className={`destination-option ${
                  destination === "local" ? "selected" : ""
                }`}
              >
                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="destination"
                    value="local"
                    checked={destination === "local"}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">
                      Local Storage
                    </span>
                    <span className="block text-xs text-gray-500">
                      Save to your computer
                    </span>
                  </span>
                </label>
              </div>
              <div
                className={`destination-option ${
                  destination === "network" ? "selected" : ""
                }`}
              >
                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="destination"
                    value="network"
                    checked={destination === "network"}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">
                      Network Drive
                    </span>
                    <span className="block text-xs text-gray-500">
                      Save to a network location
                    </span>
                  </span>
                </label>
              </div>
              <div
                className={`destination-option ${
                  destination === "cloud" ? "selected" : ""
                }`}
              >
                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="destination"
                    value="cloud"
                    checked={destination === "cloud"}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">
                      Cloud Storage
                    </span>
                    <span className="block text-xs text-gray-500">
                      Save to cloud services
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Conditional destination path input based on destination type */}
            {destination === "local" && (
              <div className="flex">
                <input
                  type="text"
                  value={destinationPath || ""}
                  onChange={(e) => setDestinationPath(e.target.value)}
                  placeholder="Enter local destination path"
                  className="flex-1 rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => {
                    // Directory browser placeholder
                    alert("Directory browser would open here");
                  }}
                >
                  Browse
                </button>
              </div>
            )}
            {destination === "network" && (
              <div className="flex">
                <input
                  type="text"
                  value={destinationPath || ""}
                  onChange={(e) => setDestinationPath(e.target.value)}
                  placeholder="Enter network path (\\server\share)"
                  className="flex-1 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}
            {destination === "cloud" && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={destinationPath || ""}
                  onChange={(e) => setDestinationPath(e.target.value)}
                >
                  <option value="">-- Select Cloud Storage --</option>
                  <option value="aws-s3">AWS S3</option>
                  <option value="azure-blob">Azure Blob Storage</option>
                  <option value="google-drive">Google Drive</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  You'll need to configure cloud credentials in your profile
                  settings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 5: Schedule Selection */}
        <div className="form-section">
          <div className="flex items-center mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-medium text-sm mr-3">
              {isAdmin ? "5" : "4"}
            </span>
            <h3 className="text-lg font-medium text-gray-900">Set Schedule</h3>
          </div>
          <div className="ml-11">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
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
          </div>
        </div>

        {/* Step 6: Create Backup Button */}
        <div className="pt-4">
          <button
            onClick={handleCreateBackup}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Backup
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupForm;
