
const mongoose = require("mongoose");

const fileResultSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },

    filesprocesed: {
        type: [[mongoose.Schema.Types.Mixed]],
        default: []
    }
});

const fileResultData = mongoose.model("fileresult", fileResultSchema);

module.exports = { fileResultData };
