import {config} from "dotenv"
config()
import express from "express"
import bodyParser from "body-parser"
import { initMongo } from "./utils/mongo.js"
import userRouter from "./modules/user/router.js"

async function init (){
    await initMongo()
    const app = express()
    app.use(bodyParser.json())
    app.use("/user", userRouter)

    app.listen(process.env.PORT, ()=>{
        console.log(`Listening on:${process.env.PORT}`)
    })
}

init()