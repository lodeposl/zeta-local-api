import qrcode from "qrcode"
import { SAP_DB as sql} from "../../utils/mssql.js"
import fs from "fs"
// import ipp from "ipp"
// import PDFDocument from "pdfkit"
import ptp from "pdf-to-printer";

import { MARCAS, PRODUCT_BY_CODE, FIRM_AND_COUNT, PRODUCTS_BY_MARCA, PRODUCTS_BY_SEARCH } from "./queries.js"
import {jsPDF} from 'jspdf';
import playwright from "playwright"

async function printhtml(htmlContent, outputPath) {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: outputPath, width:"6.4cm", height:"3.5cm" });
    console.log('PDF generated successfully');
    await browser.close();
  }

function    generatePDFfromHTML(htmlContent, outputPath) {
  const doc = new jsPDF();
  doc.html(htmlContent, {

  });
  doc.save(outputPath)
  console.log('PDF generated successfully');
}
const controller = {
    getAllMarcas: async (body, params)=>{
        let error
        let marcas = []
        try{
            const result = await sql.query(MARCAS())
            marcas = result.recordset
        }catch(err){
            error = err.message? err.message : err
        }
        return {
            error,
            marcas
        }
    },
    queryMarcas: async(body, params)=>{
        let error
        let marcas = []
        try{
            const result = await sql.query(FIRM_AND_COUNT((params.includeNoStock === 'true' ? true : false)))
            
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
    productsByMarca: async (body, params)=>{
        let error
        let products = {}
        try{
            if (!params.code) throw  "code-required"
            const result = await sql.query(PRODUCTS_BY_MARCA(params.code, (params.includeNoStock === 'true' ? true : false)))
            // console.log("marca", result)
            if (result.recordset.length===0) throw "invalid-code"
            
            products = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            products
        }

    },
    productsBySearch:async(body, params)=>{
        let error
        let products = {}
        try{
            if (!params.search) throw  "search-required"
            // console.log("entered?", params)
            const result = await sql.query(PRODUCTS_BY_SEARCH(params.brand=="none"?false:params.brand,params.search))
            // console.log("recprd", result)            
            products = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            products
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


            const url = `http://${process.env.FRONT_IP}/#/consulta/${params.code}`
            const filePath = `./public/${params.code}.png`
             image = `${params.code}.png`
            let found = false
            if(!fs.existsSync(filePath)){
                qrcode.toFile(filePath,url, {
                    version:4,
                    errorCorrectionLevel:"M",
                    color:{
                        light: '#0000'
                    }
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
    },
    print: async(body, params)=>{
        let result
        try{

            // var doc = new PDFDocument({margin:0});
            // doc.text(".", 0, 780);
            printhtml(body.rawHtml, "./docs/output.pdf")
            ptp.print("./docs/output.pdf", {
                orientation:"landscape",
                scale:"shrink",
                // printDialog:true
            }).then(console.log);

            // doc.end()
            // doc.save()
        //     await new Promise((resolve,reject)=>{

        //     fs.readFile("./docs/qr.pdf",(err,data)=>{
        //         console.log("err", err)
        //         console.log("data", data)
        //         let printer = ipp.Printer("http://admon03/ipp/printer");
        //         // console.log (body)
        //         var msg = {
        //             "operation-attributes-tag": {
        //                 "requesting-user-name": "William",
        //                 "job-name": "My Test Job",
        //                 "document-format": "application/pdf"
        //             },
        //             data: data
        //         };
        //         printer.execute("Print-Job", msg, function(err, res){
        //             console.log("MAG NIGGA", err)
        //             console.log(res);
        //             resolve("timmy")
        //         });
        //     })
        // })
            // ptp.print("./docs/qr.pdf").then(console.log);



            result = "test"
        }catch(error){
            console.log ("lol", error)
        }
        return result
    }
}

export default controller