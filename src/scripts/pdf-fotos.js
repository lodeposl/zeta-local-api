import { config } from "dotenv"
config()
import fs from "fs"
import { jsPDF } from "jspdf";
// import { SAP_DB as sql} from "../../utils/mssql.js"
import { SAP_DB as sql } from "../utils/mssql.js";
import {  PRODUCTS_BY_MARCA } from "../modules/products/queries.js";

export const FIRM_AND_COUNT = function(location,includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=2){

    const query = `
    select 
        OMRC.FirmCode,
        FirmName,
        COUNT(OMRC.FirmCode) amountProducts
        
    from OMRC 
    join OITM 
        on OMRC.FirmCode = OITM.FirmCode
    join ITM1
        on OITM.ItemCode = ITM1.ItemCode
    where
        PriceList=${priceList}
        and OITM.SellItem='Y'
        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}
        ${ includeNoActive ? '' : "and OITM.frozenFor = 'N'"}
        ${ includeNoStock ? '' :  `and OITM.OnHand > 0`}
        ${ includeNoPrice ? '' :  `and ITM1.Price > 0`}
        ${ false ? '' :  `and omrc.FirmCode in ('489', '199', '377', '601')`}
        
    group by
        OMRC.FirmCode,
        OMRC.FirmName 
    order by amountProducts desc`
    return query
}


function task (){
    setTimeout(generatePDF, 2000)
}
async function generatePDF (){
    
    let e
    let product = "lol"
    global.window = {document: {createElementNS: () => {return {}} }};
    global.navigator = {};
    global.btoa = () => {};
    let FS  =7
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "cm",
        format: [29.7, 21],
        
    });
    const pageHeight= doc.internal.pageSize.height;
    // Default export is a4 paper, portrait, using millimeters for units
    try{

        const result = await sql.query(FIRM_AND_COUNT('TODOS'))
        const marcas = result.recordset
        const productos = {}
        let y = 0.5
        let n
        let h = 0.5
        doc.setLineWidth(0.01)
        doc.table(0,0,[],[],{padding: 0.15,})
        doc.setFontSize(FS)
        let marcaIndex = 1
        for (const marca of marcas){
            n=1
            const result = await sql.query(PRODUCTS_BY_MARCA(""+marca.FirmCode,'TODOS'))
            
            //datos marca
            doc.setFont("Helvetica", "bold")
            doc.cell(1,     y, 9.5, h, "Marca: "+marca.FirmName)
            doc.cell(10.5,  y, 9.5, h, "Cantidad de Productos: "+marca.amountProducts)

            y+=h
            //Cabeceras
            doc.cell(1,     y, 0.75,    h, "#")
            doc.cell(1.75,  y, 1.5, h, "Codigo")
            doc.cell(3.25,  y, 1, h, "Inv.")
            doc.cell(4.25,  y, 13,   h, "Descripción")
            doc.cell(17.25, y, 2.75, h, "Foto")
            y+=h
            doc.setFont("Helvetica", "")


            for (const product of result.recordset){
                if (y >= 29){
                    doc.addPage();
                    doc.setFont("Helvetica", "bold")

                    y = 1 // Restart height position
                    doc.cell(1,     y, 0.75,    h, "#")
                    doc.cell(1.75,  y, 1.5, h, "Codigo")
                    doc.cell(3.25,  y, 1,    h, "Inv.")
                    doc.cell(4.25,  y, 13,   h, "Descripción")
                    doc.cell(17.25, y, 2.75, h, "Foto")
                    y+=h
                    doc.setFont("Helvetica", "")

                }
                doc.cell(1,     y, 0.75,    h, ""+n)
                doc.cell(1.75,     y, 1.5, h, product.ItemCode)
                doc.cell(3.25,  y, 1,    h, ""+product.onHand)
                doc.cell(4.25,  y, 13,   h, product.ItemName)
                doc.cell(17.25, y, 2.75, h, ".")
                y+=h
                n+=1
            }
            marcaIndex+=1
            if(marcaIndex<=marcas.length){
                if(y>24){
                    doc.addPage();
                    y = 0.5 // Restart height position

                }else{
                    y+=h
                }
            }

            console.log("marca", marca, result.recordset.length)
        }

            doc.save("./docs/ayo lol.pdf")
            console.log("Saved")
        // let size = doc.getTextWidth(marcaText)
        // let inLines = doc.splitTextToSize(marcaText, 3.3)
    delete global.window;
    delete global.navigator;
    delete global.btoa;
    }catch(error){
        console.log("what happened?", error)
        e = error.message? error.message :error
    }
    return {
        res:product,
        error:e
    }
}

export {task}