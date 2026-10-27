// src/Backend/Models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      index: true,
    },
    name:     { type: String, required: true },
    email:    { type: String, required: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    resetToken:       { type: String, default: null },
    resetTokenExpiry: { type: Date,   default: null },
    createdAt:        { type: Date,   default: Date.now },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual("id").get(function () {
  return this.customId || this._id.toString();
});

module.exports = mongoose.model("User", userSchema);
