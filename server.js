const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express=require("express")
// C:\Users\Soham Luthra\OneDrive\Desktop\APSS\Assignment-Plagiarism\src\Backend\Config\db.js
const app=express()
// app.use(express.json())
const cors=require("cors")
require("dotenv").config();
const {connection}=require("./src/Backend/Config/db")   

const {router}=require("./src/Backend/Routes/user.routes")
const {filerouter}=require("./src/Backend/Routes/file.routes")
const {fileresultrouter}=require("./src/Backend/Routes/file.result.routes")

app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json())
app.use("/",router)
app.use("/",filerouter)
app.use("/",fileresultrouter)

app.listen(8005,async()=>{
    try{
        await connection
        console.log("done")
    }
    catch{
        console.log("error")
    }
})




