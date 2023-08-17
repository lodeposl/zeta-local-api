import qrcode from "qrcode"
import sql from "../../utils/mssql.js"
import fs from "fs"
const controller = {
    queryCode: async (body, params)=>{
        let error
        let product = {}
        try{
            if (!params.code) throw  "code-required"
            const result = await sql.query(`select OITM.ItemCode, ItemName, onHand, Price from OITM join ITM1 on OITM.ItemCode = ITM1.ItemCode where PriceList=3 and OITM.ItemCode='${params.code}'`)
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
            const result = await sql.query(`select OITM.ItemCode, ItemName, onHand, Price from OITM join ITM1 on OITM.ItemCode = ITM1.ItemCode where PriceList=3 and OITM.ItemCode='${params.code}'`)
            if (result.recordset.length===0) throw "invalid-code"
            product = result.recordset[0]


            const url = `http://${process.env.FRONT_IP}/#/products/${params.code}`
            console.log("url",url)
            const filePath = `./public/${params.code}.png`
             image = `${params.code}.png`
            let found = false
            if(!fs.existsSync(filePath)){
                qrcode.toFile(filePath,url, {
                    version:4,
                    errorCorrectionLevel:"M"
                })
            }



            
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