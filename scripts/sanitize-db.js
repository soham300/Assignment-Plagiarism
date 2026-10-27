const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

db.users = [
  {
    name: "Teacher Demo",
    email: "teacher@example.edu",
    password: "$2b$10$ad90jY8G2HBx/z4unHIrP.X5805U8QVltPfulmqwAkhrj5X23mdi6",
    id: "oQEyNcwFP5Y",
    role: "teacher"
  },
  {
    name: "Student Demo",
    email: "student@example.edu",
    password: "$2b$10$y6isepwMCt0ajuMPi9yJluK1UYFJMn10VYVNrnnyUHkQQFmkyHQFO",
    id: "5-c9AooPbUg",
    role: "student"
  }
];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
console.log("Successfully sanitized db.json users");
