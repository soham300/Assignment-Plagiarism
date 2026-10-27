
const express=require("express")
const filerouter=express.Router()

const {createfiledata,updatefiledata,getfiledata}=require("../controllers/filecontroller")

const {middleware,getemailfromtoken}=require("../Middleware/jsonwebtoken")


filerouter.post("/filedata",createfiledata)
filerouter.put(
    "/filedata",middleware,getemailfromtoken,updatefiledata
);
filerouter.get(
    "/filedata",middleware,getemailfromtoken,getfiledata
);
module.exports={filerouter}
