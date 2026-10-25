const express=require("express")

const router=express.Router()
const middleware=require("../Middleware/jsonwebtoken")
const {createuser,getuserforlogin,getUsernameByEmail}=require("../controllers/usercontrollers")

router.post("/users",createuser)
router.post("/users/login",getuserforlogin)
router.get("/profile",middleware,getUsernameByEmail)

module.exports={router}