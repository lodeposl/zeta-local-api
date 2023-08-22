import qrcode from "qrcode"
import sql from "../../utils/mssql.js"
import fs from "fs"
import { PRODUCT_BY_CODE, FIRM_AND_COUNT } from "./queries.js"
import    { createCanvas, loadImage } from 'canvas';
const controller = {
    queryMarcas: async(body, params)=>{
        let error
        let marcas = []
        try{
            const result = await sql.query(FIRM_AND_COUNT())
            
            marcas = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            marcas
        }
    },
    queryCode: async (body, params)=>{
        let error
        let product = {}
        try{
            if (!params.code) throw  "code-required"
            const result = await sql.query(PRODUCT_BY_CODE(params.code))
            if (result.recordset.length===0) throw "invalid-code"
            
            product = result.recordset[0]
        }catch(err){
            error = err
        }
        return {
            error,
            product
        }

    },
    generateQR: async (body, params)=>{
        let error
        let image
        let product

        
        try{
            if (!params.code) throw "code-required"
            const result = await sql.query(PRODUCT_BY_CODE(params.code))
            if (result.recordset.length===0) throw "invalid-code"
            product = result.recordset[0]


            const url = `http://${process.env.FRONT_IP}/#/products/${params.code}`
            const filePath = `./public/${params.code}.png`
             image = `${params.code}.png`
            let found = false
            if(!fs.existsSync(filePath)){
                qrcode.toFile(filePath,url, {
                    version:4,
                    errorCorrectionLevel:"M"
                })
            }

            const canvas = createCanvas(180, 180);
            await qrcode.toCanvas(canvas, url, {
                version:5,
                errorCorrectionLevel:"H"
            })
            const imageObj = await loadImage("./public/logo-qr.png")
            imageObj.style="background-color:red;"
            
            const imgDim = { width: 60, height: 20 }; // dimensions of the logo
            const context = canvas.getContext('2d');
            context.drawImage(
              imageObj,
              canvas.width / 2 - imgDim.width / 2,
              canvas.height / 2 - imgDim.height / 2,
              imgDim.width,
              imgDim.height
            );
            
            fs.writeFileSync("./public/xd.png", canvas.toBuffer())
            



            
        }catch(err){
            console.log("err", err)
            error = err
        }
        return {
            error,
            product,
            image
        }
    }
}

export default controller