// src/Backend/Routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");
const { authenticateToken } = require("../Middleware/auth");
const { authLimiter } = require("../Middleware/rateLimiter");

// Authentication & Registration endpoints
router.post("/users", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/auth/verify", authenticateToken, authController.verifyToken);
router.post("/auth/change-password", authenticateToken, authLimiter, authController.changePassword);
router.post("/auth/forgot-password", authLimiter, authController.forgotPassword);
router.post("/auth/reset-password", authLimiter, authController.resetPassword);

module.exports = router;
