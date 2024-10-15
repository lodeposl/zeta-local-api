import qrcode from "qrcode"
import { SAP_DB as sql} from "../../utils/mssql.js"
import fs from "fs"
// import ipp from "ipp"
// import PDFDocument from "pdfkit"
import ptp from "pdf-to-printer";
import axios from "axios"

import { MARCAS, PRODUCT_BY_CODE, FIRM_AND_COUNT, PRODUCTS_BY_MARCA, PRODUCTS_BY_SEARCH } from "./queries.js"
import playwright from "playwright"
import PDFMerger from "pdf-merger-js";
async function printhtml(htmlContent, outputPath) {
    const browser = await playwright.chromium.launch();

    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: outputPath, width:"6cm", height:"4cm" });
    
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
    redirect:async(body, params)=>{
        let x
        let e
        try {
            console.log("RED")
            const api = axios.create( {baseURL: "http://192.168.0.105:4000"})
            const r = await api.post("products/print", {
                type:body.type,
                files:body.files,
                rawHtml:body.rawHtml,
                file:body.file
            })
            x = r.data
            console.log("x",x)
        }catch(error){
            console.log("Fucking red", error)
            e = error
        }
        return {
            x,
            e
        }
    },
    print: async(body, params)=>{
        let result
        let error
        try{
            let multiName = body.file
            if (body.type=="multi"){
                multiName = "Bulk "+ (new Date()+"").replace(/:/g,"-")
                const merger = new PDFMerger()
                for (let i = 0; i < body.files.length; i++) {
                    await printhtml(body.files[i].rawHtml,`./docs/${body.files[i].file}.pdf`)
                    await merger.add(`./docs/${body.files[i].file}.pdf`);
                }
                await merger.save(`./docs/${multiName}.pdf`)
                
            }else{
                await printhtml(body.rawHtml,`./docs/${body.file}.pdf`)


            }
            await new Promise((resolve, reject)=>{
                ptp.print(`./docs/${multiName}.pdf`, {
                    orientation:"landscape",
                    scale:"shrink",
                    
                    
                    // printDialog:true
                }).then(resolve).catch(reject);
            })

            result = "test"
        }catch(error){
            console.log ("lol", error)
        }
        return {
            result,
            error
        }
    }
}

export default controller