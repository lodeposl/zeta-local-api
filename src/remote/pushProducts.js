import {callListener} from "./rabbitmq.js"
import { ALL_PRODUCTS } from "../modules/products/queries.js"
import { SAP_DB } from "../utils/mssql.js"
import uniqid from "uniqid"
async function task (){
    try{
        const dbresult = await SAP_DB.query(ALL_PRODUCTS())
        const products = dbresult.recordset



        const chunks = []   
        while (products.length>0){
            chunks.push(products.splice(0,250))
        }
        console.log(`Sending in ${chunks.length} chunks`)
        const id = uniqid()
        console.log("id",id)
        const createUpdate = await callListener("jobUpdateProductsStart", {
            id,
            chunks:chunks.length
        })
        console.log("create", createUpdate)

        for(let i =0; i<chunks.length; i++){
            const result = await callListener("jobUpdateProducts", {
                updateId:id,
                chunk:i,
                products:chunks[i]
            })
            console.log("chunk"+i+"resulted in", result)
        }

    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "* * 5 * * *"
}
const name = "push-products"
export default {
    task,
    time,
    name
}