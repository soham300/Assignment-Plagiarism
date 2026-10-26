const {fileResultData}=require("../Models/fileresultmodel")


const createfileresult=async (req,res)=>{
    try {
        const { email, filesprocesed } = req.body;

        console.log(req.body);

        const std = await fileResultData.create({
            email,
            filesprocesed
        });

        return res.status(201).json({
            message: "File structure created successfully",
            data: {
                id: std._id,
                email: std.email,
                filesprocesed: std.filesprocesed
            }
        });

    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "This email already exists."
            });
        }

        return res.status(500).json({
            message: "Failed to create file structure"
        });
    }
}



const updatefileresult=async (req,res)=>{
    
    try{
        const {fileresult}=req.body;
        console.log("2. Request body received");
        console.log("3. Email:", req.email);
        if (!req.email) {
            return res.status(400).json({
                message: "Email was not found in the request"
            });
        }
        if (!Array.isArray(fileresult)) {
            return res.status(400).json({
                message: "fileresult must be an array"
            });
        }

        const updatedresult=await fileResultData.findOneAndUpdate(
            {email:req.email},
            {$push:{
                filesprocesed:fileresult
            }},

            {
                returnDocument:"after",
                runValidators:true
            }
        )    

        console.log("6. MongoDB update completed");

        if (!updatedresult) {
            return res.status(404).json({
                message: "File data not found for this user",
                email: req.email
            });
        }

        console.log("7. Sending success response");

        return res.status(200).json({
            message: "File data updated successfully",
            data: updatedresult
        });


    }
    catch(error){
        console.error("Update controller error:", error);

        return res.status(500).json({
            message: "Failed to update file data",
            error: error.message
        });
    }
}
module.exports={createfileresult,updatefileresult}
