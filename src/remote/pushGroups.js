import {callListener} from "./rabbitmq.js"
import { ITEM_GROUPS } from "../modules/products/queries.js"
import { SAP_DB } from "../utils/mssql.js"
import uniqid from "uniqid"
async function task (){
    try{
        const dbresult = await SAP_DB.query(ITEM_GROUPS())
        const groups = dbresult.recordset

        const createUpdate = await callListener("jobUpdateGroups", {groups:groups})
        console.log("create", createUpdate)

    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "5 * * * * *"
}
const name = "push-groups"
export default {
    task,
    time,
    name
}