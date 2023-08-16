import mongoose from "mongoose";

export function initMongo(){
    return new Promise((resolve,reject)=>{
        mongoose.connect(process.env.MONGO_URI).then(()=>{
            console.log("connected mongo to:", process.env.MONGO_URI)
            resolve(true)
        }).catch((error)=>{
            console.log("mongo connection failed", error)
            reject()
        })

    })
}