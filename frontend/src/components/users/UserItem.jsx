import React from "react";

const UserItem = ({ user }) => {
  return (
    <div className="user-item">
      <span>{user.email}</span>
      <span>{user.role}</span>
    </div>
  );
};

export default UserItem;