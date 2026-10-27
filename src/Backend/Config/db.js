// src/Backend/Config/db.js
// MongoDB connection + initial data seed + password migration

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { hashPassword } = require("../Middleware/auth");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/assigncheck";

// ─── Seed helpers ─────────────────────────────────────────────────────────────

async function rehashPlaintextPasswords(User) {
  try {
    const users = await User.find();
    let rehashed = 0;
    for (const user of users) {
      if (user.password && !user.password.startsWith("$2")) {
        const hashed = await hashPassword(user.password);
        await User.updateOne({ _id: user._id }, { password: hashed });
        rehashed++;
      }
    }
    if (rehashed > 0) {
      console.log(`Re-hashed ${rehashed} plain-text password(s) in MongoDB.`);
    }
  } catch (err) {
    console.error("Password re-hash migration error:", err.message);
  }
}

async function seedInitialDataIfEmpty(models) {
  const { User, Report, FileData, FileResult } = models;
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    const dbJsonPath = path.join(__dirname, "../../../db.json");
    if (!fs.existsSync(dbJsonPath)) return;

    const data = JSON.parse(fs.readFileSync(dbJsonPath, "utf-8"));

    if (Array.isArray(data.users) && data.users.length > 0) {
      for (const u of data.users) {
        const passwordHash =
          u.password && u.password.startsWith("$2")
            ? u.password
            : await hashPassword(u.password || "Password123!");
        await User.create({
          customId: u.id,
          name: u.name,
          email: u.email,
          password: passwordHash,
          role:
            u.role ||
            (u.email && u.email.includes("teacher") ? "teacher" : "student"),
        });
      }
      console.log(`Migrated ${data.users.length} users to MongoDB.`);
    }

    if (Array.isArray(data.reports) && data.reports.length > 0) {
      for (const r of data.reports) {
        await Report.create({
          customId: r.id,
          email: r.email,
          files: r.files || [],
          type: r.type || "student",
          similarity: r.similarity || 0,
          matchingSections: r.matchingSections || 0,
          differentSections: r.differentSections || 0,
          matchingPhrases: r.matchingPhrases || 0,
          spellingMistakes: r.spellingMistakes || 0,
          date: r.date || new Date(),
          textA: r.textA || "",
          textB: r.textB || "",
          filefirstmatches: r.filefirstmatches || [],
          filesecondmatches: r.filesecondmatches || [],
        });
      }
      console.log(`Migrated ${data.reports.length} reports to MongoDB.`);
    }

    if (Array.isArray(data.filedata) && data.filedata.length > 0) {
      for (const f of data.filedata) {
        await FileData.create({
          customId: f.id,
          email: f.email,
          filedetails: f.filedetails || [],
        });
      }
      console.log(`Migrated ${data.filedata.length} filedata entries.`);
    }

    if (Array.isArray(data.fileresult) && data.fileresult.length > 0) {
      for (const fr of data.fileresult) {
        await FileResult.create({
          customId: fr.id,
          email: fr.email,
          filesprocesed: fr.filesprocesed || fr.filesProcessed || [],
        });
      }
      console.log(`Migrated ${data.fileresult.length} fileresult entries.`);
    }
  } catch (err) {
    console.error("Seed error:", err.message);
  }
}

// ─── Connect ──────────────────────────────────────────────────────────────────

async function connectDB(models) {
  const activeModels = models || require("../Models");
  await mongoose.connect(MONGODB_URI);
  console.log(
    "Connected to MongoDB at:",
    MONGODB_URI.replace(/:([^:@]{3,})@/, ":***@")
  );
  await seedInitialDataIfEmpty(activeModels);
  await rehashPlaintextPasswords(activeModels.User);
}

module.exports = { connectDB, MONGODB_URI };
