import { config } from "dotenv"
config()
import { initMongo } from "../utils/mongo.js"
import { User } from "../models/users.js"
import bcrypt from "bcrypt"
async function task(args){
    await initMongo()

    const user = {
        name : "admin",
        password: bcrypt.hashSync("12345",10),
        role:"admin",
        lastLogin: new Date()
    }
    await User.create(user)
    console.log("usuario admin registrado")

}
export {task}