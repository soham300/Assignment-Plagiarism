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



module.exports={createfileresult}
