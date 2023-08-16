import sql from "../../utils/mssql.js"
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

    }
}

export default controller