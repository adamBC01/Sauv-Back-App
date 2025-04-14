import React from "react";

const AuthButton = ({ text, type = "submit" }) => {
  return (
    <button type={type} className="auth-button">
      {text}
    </button>
  );
};

export default AuthButton;