import { ALL_PRODUCTS } from "../modules/products/queries.js"
import { SAP_DB } from "../utils/mssql.js"
import { Config } from "../models/config.js"
import { Image } from "../models/images.js"
import { firebase } from "../firebase.js"
import {getStorage} from "firebase-admin/storage"
import fs from "fs"
import crypto from "crypto"
import path from "path"
import { initMongo } from "../utils/mongo.js"
import sharp from "sharp"
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

        //Comprimir imagenes
        const files = fs.readdirSync("./public/productos")
        for( const file of files){
            const img = await sharp(path.join("./public/productos", file))
            .resize({height:500, width:500,fit:"inside"})
            .jpeg({ quality: 80, progressive: true, mozjpeg: true })
            .toFile(path.join("./public/compressed",(file.split(".")[0])+".jpeg"))
        }
        //Comprimir imagenes


        //THIS JOB REQUIRES STILL:
        // DONE -Testing images Hash´s to not re-upload the same image
        // DONE -Compressing images to a standard size
        //  -Maybe make it so that only few at a time are updated

        const config = await Config.findOne()
        const imagesNotUpdated = await Image.find({lastUpdate:{$lt:config.imageUpdate}}).lean()
        if (imagesNotUpdated.length==0){
            config.imageUpdate+=1
            await config.save()
            console.log("config updated")
        }
            for (const image of imagesNotUpdated){
                try{
                    const imageData = await Image.findOne({ItemCode:image.ItemCode})
                    const update = await new Promise((resolve,reject)=>{
                        fs.readFile("./public/compressed/"+image.ItemCode+".jpeg", (err,data)=>{

                            if (!err && data){
                                const hashSum = crypto.createHash('sha256');
                                hashSum.update(data);
                                const digest = hashSum.digest("base64")
                                if (imageData.hash != digest ){
                                    console.log("Its different, update it")
                                    const options = {
                                        destination: `products/${image.ItemCode}.jpeg`,
                                    }     
                                    firebaseBucket.bucket().upload("./public/compressed/"+image.ItemCode+".jpeg", options).then((res)=>{
                                        resolve(digest)
                                    }).catch((err)=>{
                                        reject(err)
                                    })
                                }else{
                                    console.log("Its the same, ignore it")
                                    resolve(false)
                                }

                            }else{
                                //if no image exists, ignore it
                                resolve(false)
                            }
                        })
                    })
                    if (update){
                        imageData.hash = update
                    }
                    imageData.lastUpdate = config.imageUpdate
                    await imageData.save()
                    // await Image.updateOne({ItemCode:image.ItemCode}, {$set:{lastUpdate:config.imageUpdate}})

                }catch(error){
                    console.log("error", error)
                }
            }
            console.log("All images updated")
        


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