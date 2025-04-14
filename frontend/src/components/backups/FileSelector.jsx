import React from "react";

const FileSelector = ({
  backupSource,
  setBackupSource,
  selectedFiles,
  selectedFolders,
  handleFileSelection,
  handleFolderSelection,
  clearSelections,
  hideSourceToggle = false // New prop to hide the source toggle
}) => {
  // Fixed file input handler that works for both components
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array before passing it to handleFileSelection
      const filesArray = Array.from(e.target.files);
      handleFileSelection(filesArray);
    }
  };

  // Fixed folder input handler that works for both components
  const handleFolderInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array before passing it to handleFolderSelection
      const foldersArray = Array.from(e.target.files);
      handleFolderSelection(foldersArray);
    }
  };

  return (
    <div className="backup-source-container">
      {!hideSourceToggle && (
        <>
          <h3>Backup Source</h3>
          <div className="source-options">
            <label>
              <input
                type="radio"
                value="all"
                checked={backupSource === "all"}
                onChange={() => setBackupSource("all")}
              />
              All User Data
            </label>
            <label>
              <input
                type="radio"
                value="selected"
                checked={backupSource === "selected"}
                onChange={() => setBackupSource("selected")}
              />
              Selected Files/Folders
            </label>
          </div>
        </>
      )}

      {backupSource === "selected" && (
        <div className="file-selection-area">
          <div className="selection-group">
            <label className="selection-label">
              Select Files:
              <input
                type="file"
                multiple
                onChange={handleFileInputChange}
                style={{ display: "none" }}
              />
            </label>
            <span className="selection-count">{selectedFiles.length} files selected</span>
          </div>

          <div className="selection-group">
            <label className="selection-label">
              Select Folders:
              <input
                type="file"
                directory=""
                webkitdirectory=""
                multiple
                onChange={handleFolderInputChange}
                style={{ display: "none" }}
              />
            </label>
            <span className="selection-count">{selectedFolders.length} folders selected</span>
          </div>

          {(selectedFiles.length > 0 || selectedFolders.length > 0) && (
            <button onClick={clearSelections}>Clear Selections</button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileSelector;