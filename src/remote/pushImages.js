import { ALL_PRODUCTS } from "../modules/products/queries.js"
import { SAP_DB } from "../utils/mssql.js"
import { Config } from "../models/config.js"
import { Image } from "../models/images.js"
import { firebase } from "../firebase.js"
import {getStorage} from "firebase-admin/storage"
import fs from "fs"

import { initMongo } from "../utils/mongo.js"
async function task (){
    try{
        await initMongo()
        //inicializar imagenes
        const dbresult = await SAP_DB.query(ALL_PRODUCTS())
        const allImages = await Image.find().lean()
        const allCodes = allImages.map((i)=>{
            return i.ItemCode
        })
        const productCodes = dbresult.recordset.map((i)=>{
            return i.ItemCode
        })
        const notCreated = productCodes.filter((item)=>{
            return allCodes.indexOf(item)==-1;
        })
        for(const code of notCreated){
            await Image.create({ItemCode:code})
        }
        //inicializar imagenes
        const firebaseBucket = getStorage()


        //THIS JOB REQUIRES STILL:
        //  -Testing images Hash´s to not re-upload the same image
        //  -Compressing images to a standard size
        //  -Maybe make it so that only few at a time are updated

        const config = await Config.findOne()
        const imagesNotUpdated = await Image.find({lastUpdate:{$lt:config.imageUpdate}}).lean()
        if (imagesNotUpdated.length==0){
            config.imageUpdate+=1
            await config.save()
        }else{
            for (const image of imagesNotUpdated){
                try{
                    await new Promise((resolve,reject)=>{
                        fs.readFile("./public/productos/"+image.ItemCode+".png", (err,data)=>{
                            if (!err && data){
                                const options = {
                                    destination: `products/${image.ItemCode}.png`,
                                }     
                                    firebaseBucket.bucket().upload("./public/productos/"+image.ItemCode+".png", options).then((res)=>{
                                        resolve()
                                    }).catch((err)=>{
                                        reject(err)
                                    })
                            }else{
                                //if no image exists, ignore it
                                resolve()
                            }
                        })
                    })
                    await Image.updateOne({ItemCode:image.ItemCode}, {$set:{lastUpdate:config.imageUpdate}})

                }catch(error){
                    console.log("error", error)
                }
            }
            console.log("All images updated")
        }


    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "0 0 6/12 * * *"
}
const name = "push-brands"
export default {
    task,
    time,
    name
}