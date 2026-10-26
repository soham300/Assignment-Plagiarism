const express=require("express")

const router=express.Router()
const {middleware,getemailfromtoken}=require("../Middleware/jsonwebtoken")
const {createuser,getuserforlogin,getUsernameByEmail}=require("../controllers/usercontrollers")

router.post("/users",createuser)
router.post("/users/login",getuserforlogin)
router.get("/profile",middleware,getUsernameByEmail)  // this routes is checking that user is contains the valid token or not


module.exports={router}
