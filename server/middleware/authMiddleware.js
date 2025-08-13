const jwt = require("jsonwebtoken");

const JWT_SECRET = "your_jwt_secret_here"; // move to .env in production

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expecting: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, phoneNumber }
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
