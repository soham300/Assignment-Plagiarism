// src/Backend/Routes/fileResultRoutes.js
const express = require("express");
const router = express.Router();
const fileResultController = require("../Controllers/fileResultController");
const { authenticateToken } = require("../Middleware/auth");

// FileResult endpoints
router.get("/fileresult", authenticateToken, fileResultController.getFileResult);
router.post("/fileresult", authenticateToken, fileResultController.createFileResult);
router.put("/fileresult/:id", authenticateToken, fileResultController.updateFileResult);

module.exports = router;
