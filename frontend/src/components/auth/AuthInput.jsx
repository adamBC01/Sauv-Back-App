import React from "react";

const AuthInput = ({ type, placeholder, value, onChange, required }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="form-input"
    />
  );
};

export default AuthInput;