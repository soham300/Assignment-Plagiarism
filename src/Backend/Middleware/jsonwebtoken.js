const jwt=require("jsonwebtoken")

const middleware=(req,res,next)=>{
    try{
        const authHeader=req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
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


module.exports = middleware;