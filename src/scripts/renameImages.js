import {parse} from "csv/sync";
import fs from "fs"
function task(args){
    const location = "DEPOSITO"
    const file = fs.readFileSync("./csv-fotos-"+location+".csv")
    console.log("fs", file.length)
    const rows = file.toString().split("\n")
    console.log("rows", rows.length)

    rows.splice(0,1)
    console.log("rows", rows.length)
    for (const data of rows){
        const product = data.split(";")
        if (product[6].trim()!=""){
            console.log("product", data)
            fs.copyFileSync("./procesado/IMG_"+(product[6].trim())+".JPG", "./renombrado/"+(product[2].trim())+".JPG")
        }
    }

    // const records = parse(file, {bom:true})


}

export {task}