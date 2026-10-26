const express=require("express")
const fileresultrouter=express.Router();
const {middleware,getemailfromtoken}=require("../Middleware/jsonwebtoken")
const {createfileresult,updatefileresult}=require("../controllers/fileresultcontroller")

fileresultrouter.post("/fileresult",createfileresult)
fileresultrouter.put("/fileresult",middleware,getemailfromtoken,updatefileresult)

module.exports={fileresultrouter}