const express=require("express")
const fileresultrouter=express.Router();
const {createfileresult}=require("../controllers/fileresultcontroller")

fileresultrouter.post("/fileresult",createfileresult)

module.exports={fileresultrouter}