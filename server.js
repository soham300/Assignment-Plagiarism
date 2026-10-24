const express=require("express")
// C:\Users\Soham Luthra\OneDrive\Desktop\APSS\Assignment-Plagiarism\src\Backend\Config\db.js
const app=express()
// app.use(express.json())
const cors=require("cors")
const {connection}=require("./src/Backend/Config/db")   

const {router}=require("./src/Backend/Routes/user.routes")

app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json())
app.use("/",router)


app.listen(8005,async()=>{
    try{
        await connection
        console.log("done")
    }
    catch{
        console.log("error")
    }
})




