const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET || "descore-development-secret";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Потрібен токен" });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: "Недійсний або прострочений токен" });
  }
}

module.exports = { jwtSecret, requireAuth };
