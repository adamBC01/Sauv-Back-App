import React, { useState } from "react";
import axios from "axios";

const InviteGenerator = () => {
  const [invitationLink, setInvitationLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const generateInviteLink = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/invite/invite",
        { headers: { Authorization: `Bearer ${token}` } }
      );
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