const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ✅ Login Function
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
      );
      res.json({ token, role: user.role });
    }
  );
};

// ✅ Admin Registration
exports.registerAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length > 0)
          return res.status(400).json({ message: "Admin already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
          "INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')",
          [email, hashedPassword],
          (err) => {
            if (err) return res.status(500).json({ message: "Database error" });
            res
              .status(201)
              .json({ message: "Admin account created successfully" });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error creating admin" });
  }
};

// ✅ Register Standard User Using Invitation
exports.registerUser = async (req, res) => {
  const { email, password, token } = req.body;

  if (!email || !password || !token) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  db.query(
    "SELECT * FROM invitations WHERE token = ?",
    [token],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (results.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid or expired invitation token." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO users (email, password, role) VALUES (?, ?, 'user')",
        [email, hashedPassword],
        (err) => {
          if (err) return res.status(500).json({ message: "Database error" });

          // ✅ Delete the invitation after use
          db.query("DELETE FROM invitations WHERE token = ?", [token]);
          res.status(201).json({ message: "User registered successfully!" });
        }
      );
    }
  );
};

// ✅ Generate Invitation Link (Admin Only)
exports.generateInvitation = (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const token = require("crypto").randomBytes(16).toString("hex");
  db.query("INSERT INTO invitations (token) VALUES (?)", [token], (err) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error generating invitation", error: err });
    res.json({ invitationLink: `http://localhost:3000/invite?token=${token}` });
  });
};

// ✅ Get All Users (Admin Only)
exports.getAllUsers = (req, res) => {
  db.query("SELECT id, email, role FROM users", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
};

// ✅ Get User Data (Any Authenticated User)
exports.getUserData = (req, res) => {
  db.query(
    "SELECT id, email, role FROM users WHERE id = ?",
    [req.user.userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    }
  );
};
