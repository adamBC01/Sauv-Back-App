import React from "react";

const AuthInput = ({ type, placeholder, value, onChange, required, ...props }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="form-input"
      {...props}
    />
  );
};

export default AuthInput;