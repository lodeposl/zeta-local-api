import { config } from "dotenv"
config()
import { initMongo } from "../utils/mongo.js"
import { Config } from "../models/config.js"
import bcrypt from "bcrypt"
async function task(args){
    await initMongo()

    let config = await Config.findOne()

    if (!config){
        await Config.create({})
        config = await Config.findOne()
    }

    const permissions = [ "imprimir-etiquetas" ]

    for (const perm of permissions ){
        if (config.permissions.indexOf(perm)<0){
            config.permissions.push(perm)
            console.log(`created permission for ${perm}`)
        }
    }

    config.markModified("permissions")
    await config.save()



    console.log("Permisos creados")

}
export {task}