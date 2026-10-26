
const filedata = require("../Models/filemodel");

const createfiledata = async (req, res) => {
    try {
        const { email, filedetails } = req.body;

        console.log(req.body);

        const std = await filedata.create({
            email,
            filedetails
        });



        return res.status(201).json({
            message: "File structure created successfully",
            data: {
                id: std._id,
                email: std.email,
                filedetails: std.filedetails
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
};


const updatefiledata = async (req, res) => {
    console.log("file data is sending its step")
    console.log("1. Update controller started");

    try {
        const { filedetails } = req.body;

        console.log("2. Request body received");
        console.log("3. Email:", req.email);
        console.log("4. Number of files:", 
            Array.isArray(filedetails) ? filedetails.length : "Not an array"
        );

        if (!req.email) {
            return res.status(400).json({
                message: "Email was not found in the request"
            });
        }

        if (!Array.isArray(filedetails)) {
            return res.status(400).json({
                message: "filedetails must be an array"
            });
        }

        // console.log("5. Starting MongoDB update");

        const updatedData = await filedata.findOneAndUpdate(
            { email: req.email },
            {
                $setOnInsert: { email: req.email },
                $push: {
                    filedetails: { $each: filedetails }
                }
            },
            {
                returnDocument: "after",
                runValidators: true,
                upsert: true
            }
        );

        // console.log("6. MongoDB update completed");

        if (!updatedData) {
            return res.status(404).json({
                message: "File data not found for this user",
                email: req.email
            });
        }

        // console.log("7. Sending success response");

        return res.status(200).json({
            message: "File data updated successfully",
            data: updatedData
        });

    } catch (error) {
        console.error("Update controller error:", error);

        return res.status(500).json({
            message: "Failed to update file data",
            error: error.message
        });
    }
};

module.exports = { createfiledata ,updatefiledata};
