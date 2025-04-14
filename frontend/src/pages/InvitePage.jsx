import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import AuthInput from "../components/auth/AuthInput";
import AuthButton from "../components/auth/AuthButton";
import { formStyles } from "../components/auth/authStyles";
import "./InvitePage.css";

const InvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Get token from URL
  const [isValid, setIsValid] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/"); // Redirect to home if no token
      return;
    }

    // Verify the invitation link
    axios
      .get(`http://localhost:5000/api/invite/verify/${token}`)
      .then(() => setIsValid(true))
      .catch(() => setIsValid(false));
  }, [token, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/register-user", {
        email,
        password,
        token,
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 2000); // Redirect after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  if (isValid === null) return <p>Verifying invitation...</p>;
  if (isValid === false) return <p>Invalid or expired invitation link.</p>;

  return (
    <div className={formStyles.container}>
      <h2>Register as a Standard User</h2>
      {success ? (
        <p className={formStyles.success}>Account created! Redirecting...</p>
      ) : (
        <form onSubmit={handleRegister} className={formStyles.form}>
          <AuthInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={true}
          />
          <AuthInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={true}
          />
          <AuthButton text="Register" />
          {error && <p className={formStyles.error}>{error}</p>}
        </form>
      )}
    </div>
  );
};

export default InvitePage;