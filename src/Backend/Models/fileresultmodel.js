const {default:mongooes}=require("mongoose")

const fileResultSchema = new mongooes.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },

    filesprocesed: {
        type: [
            [
                mongooes.Schema.Types.Mixed
            ]
        ],
        default: []
    }
});


const fileResultData=mongooes.model("fileresult",fileResultSchema)
module.exports={fileResultData}