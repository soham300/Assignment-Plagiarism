
const express=require("express")
const filerouter=express.Router()

const {createfiledata,updatefiledata}=require("../controllers/filecontroller")

const {middleware,getemailfromtoken}=require("../Middleware/jsonwebtoken")


filerouter.post("/filedata",createfiledata)
filerouter.put(
    "/filedata",
    (req, res, next) => {
        console.log("1. PUT route reached");
        next();
    },
    (req, res, next) => {
        console.log("2. Before JWT middleware");
        next();
    },
    middleware,
    (req, res, next) => {
        console.log("3. JWT verified. User ID:", req.userId);
        next();
    },
    getemailfromtoken,
    (req, res, next) => {
        console.log("4. Email fetched:", req.email);
        next();
    },
    updatefiledata
);
module.exports={filerouter}
