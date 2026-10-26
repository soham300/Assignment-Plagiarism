const jwt=require("jsonwebtoken")
const user=require("../Models/usermodels")

const middleware=(req,res,next)=>{
    try{
        const authHeader=req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return res.status(401).json({
                message: "Please log in"
            });
        }

        const token=authHeader.split(" ")[1]
        const decode=jwt.verify(
            token,
            process.env.JWT_SECRET
        )

        req.userId=decode.userId
        next()
    }
    catch (error) {
        return res.status(401).json({
            message: "Token is invalid or expired. Please log in again."
        });
    }
};



// const middlewaretochecktoken=(req,res,next)=>{
//     const authheder=req.headers.authorization;

//     const token=authheder.split(" ")[1];
//     const decode=jwt.verify(
//         token,
//         process.env.JWT_SECRET 
//     )
//     req.userId=decode.userId;

//     next()
// }


const getemailfromtoken=async (req,res,next)=>{
    
    try {
    const foundUser = await user.findById(req.userId)
    if (!foundUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    // console.log(foundUser);
    req.email=foundUser.email;
    return next();
    
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user"
    });
  }

}

module.exports = {middleware,getemailfromtoken};