const jwt = require("jsonwebtoken");
const config = require("../config");

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return req.cookies[config.adminCookieName] || null;
}

function requireAdmin(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, config.adminSessionSecret);
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

module.exports = {
  requireAdmin
};
