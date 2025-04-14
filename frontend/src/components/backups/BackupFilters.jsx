import React from "react";

const BackupFilters = ({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  destinationFilter,
  setDestinationFilter,
  userFilter,
  setUserFilter,
  users,
  applyFilters,
  isAdmin = false
}) => {
  // Add a reset filters function
  const handleResetFilters = () => {
    // Reset all filter states to their default values
    setStatusFilter("all");
    setTypeFilter("all");
    if (setDestinationFilter) setDestinationFilter("all");
    if (setUserFilter) setUserFilter("all");

    // Call applyFilters after a brief timeout to ensure state updates
    setTimeout(() => {
      applyFilters();
    }, 0);
  };

  return (
    <div className="backup-filters">
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="failed">Failed</option>
            <option value="scheduled">Scheduled</option>
            <option value="restoring">Restoring</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-control"
          >
            <option value="all">All</option>
            <option value="complete">Complete</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        {/* Always show destination filter */}
        <div className="filter-group">
          <label htmlFor="destination-filter">Destination:</label>
          <select
            id="destination-filter"
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="form-control"
          >
            <option value="all">All</option>
            <option value="cloud">Cloud</option>
            <option value="local">Local</option>
            <option value="external">External</option>
          </select>
        </div>

        {/* Only show user filter in admin view */}
        {isAdmin && setUserFilter && users && (
          <div className="filter-group">
            <label htmlFor="user-filter">User:</label>
            <select
              id="user-filter"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="form-control"
            >
              <option value="all">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-buttons">
          <button
            className="apply-filters-button"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
          <button
            className="reset-filters-button"
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupFilters;