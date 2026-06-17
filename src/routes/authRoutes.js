const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

function setAdminCookie(res, token) {
  res.cookie(config.adminCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    maxAge: 1000 * 60 * 60 * 24
  });
}

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const isValid = email === config.adminEmail && password === config.adminPassword;

  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { email: config.adminEmail, role: "admin" },
    config.adminSessionSecret,
    { expiresIn: "24h" }
  );

  setAdminCookie(res, token);
  return res.json({ message: "Login successful" });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(config.adminCookieName);
  return res.json({ message: "Logged out" });
});

router.get("/me", requireAdmin, (req, res) => {
  return res.json({
    email: req.admin.email,
    role: req.admin.role
  });
});

module.exports = router;
