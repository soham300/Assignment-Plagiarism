// src/Backend/Routes/fileDataRoutes.js
const express = require("express");
const router = express.Router();
const fileDataController = require("../Controllers/fileDataController");
const { authenticateToken } = require("../Middleware/auth");

// FileData endpoints
router.get("/filedata", authenticateToken, fileDataController.getFileData);
router.post("/filedata", authenticateToken, fileDataController.createFileData);
router.put("/filedata/:id", authenticateToken, fileDataController.updateFileData);

module.exports = router;
