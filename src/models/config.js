import mongoose, { mongo } from "mongoose";

const configSchema = new mongoose.Schema({
    permissions:{
        type:[String],
        default:[]
    },
    imageUpdate:{
        type:Number,
        default:0
    }
})

export const Config = mongoose.model("config",configSchema)