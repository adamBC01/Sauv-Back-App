const checkAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Accès interdit : administrateur requis" });
  }
  next(); // Si admin, continuer l'exécution de la requête
};

module.exports = checkAdmin;
