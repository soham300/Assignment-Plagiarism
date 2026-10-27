const express=require("express")
const fileresultrouter=express.Router();
const {middleware,getemailfromtoken}=require("../Middleware/jsonwebtoken")
const {createfileresult,updatefileresult,getfileresult,deletefileresult}=require("../controllers/fileresultcontroller")

fileresultrouter.post("/fileresult",createfileresult)
fileresultrouter.put("/fileresult",middleware,getemailfromtoken,updatefileresult)
fileresultrouter.get("/fileresult",middleware,getemailfromtoken,getfileresult)
fileresultrouter.delete("/fileresult",middleware,getemailfromtoken,deletefileresult)

module.exports={fileresultrouter}