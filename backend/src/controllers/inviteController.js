const db = require("../config/db");
const crypto = require("crypto");

// ✅ Generate an Invitation Token
exports.generateInvitation = (req, res) => {
  const token = crypto.randomBytes(16).toString("hex");

  db.query(
    "INSERT INTO invitations (token) VALUES (?)",
    [token],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error generating invitation", error: err });

      // ✅ Generate a frontend link
      const invitationLink = `http://localhost:3000/invite?token=${token}`;
      res.status(200).json({ invitationLink });
    }
  );
};

// ✅ Verify the Invitation Token
exports.verifyInvite = (req, res) => {
  const { token } = req.params; // Get token from URL

  db.query(
    "SELECT * FROM invitations WHERE token = ?",
    [token],
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error verifying invitation", error: err });

      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "Invalid or expired invitation link." });
      }

      res.status(200).json({ message: "Invitation verified successfully." });
    }
  );
};
