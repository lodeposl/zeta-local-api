import {callListener} from "./rabbitmq.js"
import { MARCAS } from "../modules/products/queries.js"
import { SAP_DB } from "../utils/mssql.js"
import uniqid from "uniqid"
async function task (){
    try{
        const dbresult = await SAP_DB.query(MARCAS())
        const marcas = dbresult.recordset

        const createUpdate = await callListener("jobUpdateBrands", {brands:marcas})
        console.log("create", createUpdate)

    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "5 * * * * *"
}
const name = "push-brands"
export default {
    task,
    time,
    name
}