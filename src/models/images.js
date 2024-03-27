import mongoose, { mongo } from "mongoose";

const imageScheme = new mongoose.Schema({
    ItemCode:{
        require:true,
        index:true,
        type:String
    },
    hash:String,
    lastUpdate:{
        type:Number,
        default:-1
    }
}, {timestamps:true})

export const Image = mongoose.model("image",imageScheme)