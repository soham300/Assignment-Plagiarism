
const { default: mongoose } = require("mongoose")
// const mongooes=require("mongoose")

const userScema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }

})









const user=mongoose.model("Users",userScema)
module.exports=user;

