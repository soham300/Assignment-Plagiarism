const mongoes=require("mongoose")
require("dotenv").config()
const connections=mongoes.connect(process.env.MONGO_URI)
module.exports=(connections)


