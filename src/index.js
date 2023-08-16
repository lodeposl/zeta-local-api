import {config} from "dotenv"
config()
import express from "express"
import { initMongo } from "./utils/mongo.js"

async function init (){
    await initMongo()
    const app = express()
    

    app.listen(process.env.PORT, ()=>{
        console.log(`Listening on:${process.env.PORT}`)
    })
}

init()