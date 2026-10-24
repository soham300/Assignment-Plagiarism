const bcrypt=require("bcrypt")

const hashpassword=async (password)=>{
    return await bcrypt.hash(password,10)
}


const comepareword=async(password,hashpassword)=>{
    return await bcrypt.compare(password,hashpassword)
}

module.exports={
    hashpassword,
    comepareword
}