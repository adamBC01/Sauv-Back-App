import React from "react";

const Card = ({ title, children }) => {
  return (
    <div className="admin-card">
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default Card;