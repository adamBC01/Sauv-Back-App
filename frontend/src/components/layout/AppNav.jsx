import React from "react";
import { useNavigate } from "react-router-dom";

const AppNav = ({ title }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  return (
    <nav className="admin-nav">
      <h1>{title}</h1>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </nav>
  );
};

export default AppNav;