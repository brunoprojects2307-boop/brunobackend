const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("node:path");
const fs = require("node:fs");

const authRoutes = require("./routes/authRoutes");
const productsRoutes = require("./routes/productsRoutes");
const couponsRoutes = require("./routes/couponsRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();

function firstExistingPath(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const uploadsPath = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", publicRoutes);
app.use("/api/admin", authRoutes);
app.use("/api/admin/products", productsRoutes);
app.use("/api/admin/coupons", couponsRoutes);
app.use("/api/admin/categories", categoriesRoutes);

const projectRootPath = path.join(__dirname, "..");
const repoRootPath = path.join(__dirname, "..", "..");

const adminPath = firstExistingPath([
  path.join(projectRootPath, "admin"),
  path.join(repoRootPath, "admin")
]);

if (adminPath) {
  app.use("/admin", express.static(adminPath));
} else {
  app.get("/admin", (_req, res) => {
    res.status(404).json({ message: "Admin static files not found in this deployment" });
  });
}

const storefrontIndexPath = firstExistingPath([
  path.join(projectRootPath, "index.html"),
  path.join(repoRootPath, "index.html")
]);

if (storefrontIndexPath) {
  app.use(express.static(path.dirname(storefrontIndexPath)));
}

app.get("/", (_req, res) => {
  if (storefrontIndexPath) {
    return res.sendFile(storefrontIndexPath);
  }

  return res.json({
    status: "ok",
    message: "Backend is running",
    health: "/api/health"
  });
});

module.exports = app;
