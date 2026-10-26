const mongoes = require("mongoose");
require("dotenv").config();
const connections = mongoes.connect(process.env.MONGO_URI);
connections.connection = connections;
connections.connections = connections;
module.exports = connections;
