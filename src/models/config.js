import mongoose, { mongo } from "mongoose";

const configSchema = new mongoose.Schema({
    permissions:{
        type:[String],
        default:[]
    }
})

export const Config = mongoose.model("config",configSchema)