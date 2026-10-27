// server.js
// Express + MongoDB backend for AssignCheck
// Clean MVC Architecture: Models, Views, Controllers, Routes, Middleware, Services

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { connectDB } = require("./src/Backend/Config/db");
const models = require("./src/Backend/Models");
const { generalLimiter } = require("./src/Backend/Middleware/rateLimiter");
const registerRoutes = require("./src/Backend/Routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(generalLimiter);

// Serve frontend static assets with cache headers
const staticOptions = {
  maxAge: "1h",
  etag: true
};
app.use("/src/Frontend", express.static(path.join(__dirname, "src/Frontend"), staticOptions));
app.use("/Assets", express.static(path.join(__dirname, "Assets"), staticOptions));
app.use(express.static(path.join(__dirname, "src/Frontend"), staticOptions));
app.use(express.static(path.join(__dirname, "src/Frontend/Templates"), staticOptions));

// Root URL → redirect to the homepage
app.get("/", (req, res) => {
  res.redirect("/Templates/index.html");
});

// Register all MVC Routes
registerRoutes(app);

// 404 handler for unmatched API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  next();
});

// Start Server & Connect Database
if (require.main === module) {
  connectDB(models)
    .then(() => {
      app.listen(PORT, () => {
        console.log(`AssignCheck Secure Backend (MVC) running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err.message);
      process.exit(1);
    });
}

module.exports = {
  app,
  ...models
};
