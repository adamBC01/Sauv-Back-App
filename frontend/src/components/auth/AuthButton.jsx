import React from "react";

const AuthButton = ({ text, type = "submit", ...props }) => {
  return (
    <button type={type} className="auth-button" {...props}>
      {text}
    </button>
  );
};

export default AuthButton;