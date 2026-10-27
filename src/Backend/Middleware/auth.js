// src/Backend/Middleware/auth.js
// Authentication and Role-Based Authorization Middleware

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET || "assigncheck_fallback_secret_key_2026";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("FATAL: JWT_SECRET environment variable is missing in production mode.");
  process.exit(1);
}

/**
 * Strict authentication middleware. Rejects any request missing a valid Bearer token.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Optional token middleware: parses token if provided, but does not block if missing.
 */
function optionalToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded;
    } else {
      req.user = null;
    }
    next();
  });
}

/**
 * Role-based access control middleware.
 * @param  {...string} roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userRole = req.user.role || "student";
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to access this resource" });
    }
    next();
  };
}

/**
 * Hash a plain-text password using bcrypt.
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain-text password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Format document and sanitize sensitive fields (password, reset tokens).
 * @param {object} doc
 * @returns {object|null}
 */
function formatDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = doc.customId || (doc._id ? doc._id.toString() : doc.id);
  delete obj.__v;
  delete obj.password;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  return obj;
}

module.exports = {
  JWT_SECRET,
  SALT_ROUNDS,
  authenticateToken,
  optionalToken,
  requireRole,
  hashPassword,
  comparePassword,
  formatDoc
};
