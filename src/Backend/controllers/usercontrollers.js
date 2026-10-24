const user=require("../Models/usermodels")
const {hashpassword,comepareword}=require("../Middleware/passwordhash")
const jwt=require("jsonwebtoken")

const createuser=async (req,res)=>{
    
    try{
        const { username, email, password } = req.body;
        
        const hashedPassword = await hashpassword(password);

        const std=await user.create({
            username:username,
            email:email,
            password:hashedPassword
        });

        // console.log(std);
        res.send({
            "message":"user saved succesufully",
            "user":std
        })
    }
    catch(error){
        console.log(error)
    }
}



const getuserforlogin=async (req,res)=>{
    try{
        const {email,password}=req.body;
        

        // const email=req.query.email;
        const data=await user.findOne({email});
        // console.log(data)
        if (!data) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await comepareword(
            password,
            data.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token=jwt.sign(
            { userId: data._id },   
            process.env.JWT_SECRET,
            { expiresIn: "30m" }
        )

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: data._id,
                username: data.username,
                email: data.email
            }
        });
    }
    catch{
        // console.log(error);
        return res.status(500).json({
            message: "Something went wrong"
        });
    }
}



const getUsernameByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    const foundUser = await user.findOne({ email })

    if (!foundUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json([foundUser]);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user"
    });
  }
};

// const getsinglestudnets=async(req,res)=>{
//     try{
//         const id=req.params.id
//         const data=await studnet.findByID(id)
//         res.send({
            
//             "message":"user fetched successfully",
//             data
//         }
//         )

//     }
//     catch(error){
//         res.send(error)
   
//     }
// }

// const deletestudnets=async (req,res)=>{
//     try{
//         const id=req.params.id
//         const data=await studnets.findByIDDelete(id)

//         res.send({
//             "message":"user deleted",
//             data
//         })


//     }
//     catch(error){
//         res.send()
//     }
// }

module.exports={createuser,getuserforlogin,getUsernameByEmail};
