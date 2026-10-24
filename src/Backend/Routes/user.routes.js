const express=require("express")

const router=express.Router()
const {createuser,getuserforlogin,getUsernameByEmail}=require("../controllers/usercontrollers")

router.post("/users",createuser)
router.post("/users/login",getuserforlogin)
router.get("/user/login",getUsernameByEmail)

module.exports={router}