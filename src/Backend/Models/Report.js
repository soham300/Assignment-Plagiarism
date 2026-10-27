// src/Backend/Models/Report.js

const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      index: true,
    },
    email:            { type: String, required: true, lowercase: true, trim: true, index: true },
    files:            [{ type: String }],
    type:             { type: String, default: "student" },
    similarity:       { type: Number, default: 0 },
    coverageA:        { type: Number, default: 0 },
    coverageB:        { type: Number, default: 0 },
    symmetric:        { type: Boolean, default: true },
    matchingSections: { type: Number, default: 0 },
    differentSections:{ type: Number, default: 0 },
    matchingPhrases:  { type: Number, default: 0 },
    spellingMistakes: { type: Number, default: 0 },
    date:             { type: Date,   default: Date.now, index: -1 },
    textA:            { type: String, default: "" },
    textB:            { type: String, default: "" },
    filefirstmatches: { type: Array,  default: [] },
    filesecondmatches:{ type: Array,  default: [] },
    commonPhrases:    { type: Array,  default: [] },
    spellingMistakesA:{ type: Array,  default: [] },
    spellingMistakesB:{ type: Array,  default: [] },
    allSpellingMistakes:{ type: Array, default: [] },
    disclaimer: {
      type: String,
      default:
        "Estimated textual overlap based on sliding n-gram analysis. Does not constitute definitive proof of academic misconduct.",
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reportSchema.index({ email: 1, date: -1 });

reportSchema.virtual("id").get(function () {
  return this.customId || this._id.toString();
});

module.exports = mongoose.model("Report", reportSchema);
