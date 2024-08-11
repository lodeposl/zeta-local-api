

import sqlite3 from "sqlite3"
const sqlite = new sqlite3.Database("sqlite.db")

let facturasData=[]
function generateFacturas(x){
    const f = []
    for (let i=0; i<x; i++){
        f.push({
            id:i,
            monto:i*100,
            fecha:new Date(),
            processed:false
        })
    }
    return f
}

facturasData = generateFacturas(50)

const controller = {
    facturas:async (body,params)=>{
        let error
        console.log("lol", facturasData)
        try{
        }catch(err){
            error = err
        }
        return {
            error,
            facturas:facturasData
        }  
    },
    procesar:async (body,params)=>{
        let error
        try{
            for (const fact of facturasData){
                if (fact.id==body.id){
                    fact.processed = true
                }
            }
        }catch(err){
            error = err
        }
        console.log("facturasData", facturasData)
        return {
            processed:true,
            error
        }
    }
}

export default controller