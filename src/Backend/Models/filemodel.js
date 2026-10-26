const {default:mongooes}=require("mongoose")


// const xyz = { filename: file.name, filesize: file.size, chunks: chunks };

const fileScema=new mongooes.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },

    filedetails:[
        {
            filename:String,
            filesize:Number,
            chunks:[
                {
                    text:String,
                    grams:[String]
                }
            ]
        }
    ]

})

const filedata=mongooes.model("filedata",fileScema)
module.exports=filedata