const mysql = require("mysql2");
require("dotenv").config(); // Charger les variables d'environnement

// Configuration du pool de connexions MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sauvegarde_db",
  waitForConnections: true,
  connectionLimit: 10, // Nombre maximal de connexions
  queueLimit: 0,
});

// Vérification de la connexion
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Erreur de connexion à MySQL :", err.message);
    process.exit(1); // Quitter si la connexion échoue
  } else {
    console.log("✅ Connecté à MySQL !");
    connection.release(); // Relâcher la connexion après test
  }
});

module.exports = db;
