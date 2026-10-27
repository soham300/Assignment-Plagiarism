// src/Backend/Models/FileResult.js

const mongoose = require("mongoose");

const fileResultSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      index: true,
    },
    email:         { type: String, required: true, lowercase: true, trim: true, index: true },
    filesprocesed: { type: Array, default: [] },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

fileResultSchema.virtual("id").get(function () {
  return this.customId || this._id.toString();
});

module.exports = mongoose.model("FileResult", fileResultSchema);
