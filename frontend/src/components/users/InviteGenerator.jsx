import React, { useState } from "react";
import axios from "axios";

// API base URL - adjust this to match your backend URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const InviteGenerator = () => {
  const [invitationLink, setInvitationLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const generateInviteLink = async () => {
    try {
      const token = localStorage.getItem("token");
      // Use the correct API endpoint URL
      const response = await axios.get(`${API_URL}/auth/invite`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Invitation link response:", response.data);
      setInvitationLink(response.data.invitationLink);
      setLinkCopied(false);
    } catch (error) {
      console.error("Error generating invitation link:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  return (
    <>
      <button onClick={generateInviteLink} className="invite-button">
        Generate Invitation Link
      </button>
      {invitationLink && (
        <div className="invite-link-container">
          <span>{invitationLink}</span>
          <button onClick={copyToClipboard}>
            {linkCopied ? "✓ Copied" : "📋 Copy"}
          </button>
        </div>
      )}
    </>
  );
};

export default InviteGenerator;
