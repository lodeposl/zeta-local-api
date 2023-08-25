import qrcode from "qrcode"
import sql from "../../utils/mssql.js"
import fs from "fs"
import { PRODUCT_BY_CODE, FIRM_AND_COUNT, PRODUCTS_BY_MARCA } from "./queries.js"
const controller = {
    queryMarcas: async(body, params)=>{


        const result = await sql.query(FIRM_AND_COUNT((params.includeNoStock === 'true' ? true : false)))
            
        return result.recordset

    },
    queryCode: async (body, params)=>{

            if (!params.code) throw  "code-required"
            const result = await sql.query(PRODUCT_BY_CODE(params.code))
            if (result.recordset.length===0) throw "invalid-code"
            
            return result.recordset[0]


    },
    productsByMarca: async (body, params)=>{

            if (!params.code) throw  "code-required"
            const result = await sql.query(PRODUCTS_BY_MARCA(params.code, (params.includeNoStock === 'true' ? true : false)))
            if (result.recordset.length===0) throw "invalid-code"
            
        return result.recordset


    },
    generateQR: async (body, params)=>{
 
            if (!params.code) throw "code-required"
            const result = await sql.query(PRODUCT_BY_CODE(params.code))
            if (result.recordset.length===0) throw "invalid-code"
            const product = result.recordset[0]


            const url = `http://${process.env.FRONT_IP}/#/consulta/${params.code}`
            const filePath = `./public/${params.code}.png`
            const image = `${params.code}.png`
            if(!fs.existsSync(filePath)){
                qrcode.toFile(filePath,url, {
                    version:4,
                    errorCorrectionLevel:"M"
                })
            }
            
        return {
            product,
            image
        }
    }
}

export default controller