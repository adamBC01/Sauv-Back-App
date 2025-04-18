import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

// API base URL - adjust this to match your backend URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const InvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Get token from URL
  const [isValid, setIsValid] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      console.log("No token found in URL, redirecting to home");
      navigate("/"); // Redirect to home if no token
      return;
    }

    console.log("Token found in URL:", token);

    // Verify the invitation link
    const verifyToken = async () => {
      try {
        console.log(
          "Verifying token with API:",
          `${API_URL}/invite/verify/${token}`
        );
        // Use the correct API endpoint URL
        const response = await axios.get(`${API_URL}/invite/verify/${token}`);
        console.log("Token verification response:", response.data);
        setIsValid(true);
      } catch (err) {
        console.error("Error verifying token:", err);
        console.error("Error details:", err.response?.data);
        console.error("Error status:", err.response?.status);
        setIsValid(false);
        // Extract more detailed error information if available
        if (err.response?.data?.message) {
          setErrorDetails(err.response.data.message);
        } else if (err.response?.status === 404) {
          setErrorDetails(
            "The invitation link does not exist or has been removed."
          );
        } else if (err.response?.status === 410) {
          setErrorDetails(
            "This invitation has expired. Please request a new one."
          );
        } else {
          setErrorDetails(
            "There was a problem verifying your invitation. Please try again later."
          );
        }
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      console.log("Registering user with token:", token);
      const response = await axios.post(`${API_URL}/auth/register-user`, {
        email,
        password,
        token,
      });
      console.log("Registration response:", response.data);

      setSuccess(true);
      setTimeout(() => navigate("/"), 2000); // Redirect after 2 seconds
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Registration error details:", err.response?.data);
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  // Feature boxes data
  const features = [
    {
      title: "Secure Backups",
      description:
        "Your data is automatically backed up with enterprise-grade security",
      icon: (
        <svg
          className="h-6 w-6 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      title: "Easy Recovery",
      description: "Quickly restore your files with just a few clicks",
      icon: (
        <svg
          className="h-6 w-6 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
    {
      title: "Scheduled Backups",
      description: "Set up automatic backups that run on your schedule",
      icon: (
        <svg
          className="h-6 w-6 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Multiple Storage Options",
      description:
        "Choose between local, network, or cloud storage for your backups",
      icon: (
        <svg
          className="h-6 w-6 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      ),
    },
  ];

  // Show loading state while verifying token
  if (isValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Show error state if token is invalid
  if (isValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-700">
                  Invalid or expired invitation link
                </p>
                <p className="mt-2 text-sm text-red-600">
                  {errorDetails ||
                    "Please contact your administrator for a new invitation."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Need help?
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  If you believe this is an error, please contact your system
                  administrator with the following information:
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded-md">
                  <p className="font-mono text-xs break-all">Token: {token}</p>
                </div>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Return to Login
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show registration form if token is valid
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Feature boxes */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-700 p-12 flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Welcome to Sauvegarde
          </h1>
          <div className="grid grid-cols-1 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-md p-2">
                    {feature.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-indigo-100">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Create Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Complete your registration to access the backup system
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Account created successfully! Redirecting to login...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:scale-[1.02]"
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
