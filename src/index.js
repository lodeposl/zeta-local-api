import {config} from "dotenv"
config()
import express from "express"
import bodyParser from "body-parser"
import cors from "cors"

import { initMongo } from "./utils/mongo.js"
import userRouter from "./modules/user/router.js"
import productsRouter from "./modules/products/router.js"
// import { initJobs } from "./remote/index.js"

async function init (){
    // await initMongo()
    // await initJobs()
    const app = express()
    app.use(cors())
    app.use(express.static("public"))
    app.use(express.static("front"))
    app.use(bodyParser.json())
    app.use("/user", userRouter)
    app.use("/products", productsRouter)

    app.listen(process.env.PORT, ()=>{
        console.log(`Listening on:${process.env.PORT}`)
    })
}

init()