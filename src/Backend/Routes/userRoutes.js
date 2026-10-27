// src/Backend/Routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../Controllers/userController");
const { authenticateToken } = require("../Middleware/auth");

// User endpoints (protected by JWT token)
router.get("/users", authenticateToken, userController.getUsers);
router.get("/users/:id", authenticateToken, userController.getUserById);
router.put("/users/:id", authenticateToken, userController.updateUser);

module.exports = router;
