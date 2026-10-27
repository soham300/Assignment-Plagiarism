// src/Backend/Models/FileData.js

const mongoose = require("mongoose");

const fileDataSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      index: true,
    },
    email:       { type: String, required: true, lowercase: true, trim: true, index: true },
    filedetails: { type: Array, default: [] },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

fileDataSchema.virtual("id").get(function () {
  return this.customId || this._id.toString();
});

module.exports = mongoose.model("FileData", fileDataSchema);
