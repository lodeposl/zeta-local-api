import qrcode from "qrcode"
import { SAP_DB as sql} from "../../utils/mssql.js"
import fs from "fs"
// import ipp from "ipp"
// import PDFDocument from "pdfkit"
import ptp from "pdf-to-printer";
import axios from "axios"

import { MARCAS, PRODUCT_BY_CODE, FIRM_AND_COUNT, PRODUCTS_BY_MARCA, PRODUCTS_BY_SEARCH, PRODUCTS_BY_CODES } from "./queries.js"
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";
import { createClient } from 'redis';

const formatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });

function wordsForWords(words, split){
    if (split.length==1){
        if(split[0]==words.join(" ")){
            return true
        }
    }
    let splitInWords = true

    for (const word of split){
        if (words.indexOf(word)<0){
            splitInWords = false
        }
    }
    return splitInWords
}

async function JSPDF (body, params){
    let e
    global.window = {document: {createElementNS: () => {return {}} }};
    global.navigator = {};
    global.btoa = () => {};
    let FS
    // Default export is a4 paper, portrait, using millimeters for units
    try{
        let pdfName = "Bulk "+ (new Date()+"").replace(/:/g,"-")
        const merger = new PDFMerger()
        const productData = {

        }
        const result = await sql.query(PRODUCTS_BY_CODES(body.products, body.props.location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock))
        if (result.recordset.length===0) throw "invalid-codes"
        const allProducts = result.recordset
        for (const product of allProducts){
            productData[product.ItemCode] = product
        }


        for (const ItemCode of body.products){
            const product = productData[ItemCode]
            
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "cm",
                format: [15.24, 10.08],
                
            });
            
            const leftEdge = 1.8
            const leftSpace = 1
            const rightEdge = 12.5
            
            doc.setFontSize(16)
            
            //generate qr
            const url = `http://${process.env.FRONT_IP}/#/consulta/${product.ItemCode}`
            const filePath = `./public/${product.ItemCode}.png`

            if(!fs.existsSync(filePath)){
                await qrcode.toFile(filePath,url, {
                    version:4,
                    errorCorrectionLevel:"M",
                    color:{
                        light: '#0000'
                    }
                })
            }
            const refWhiteFile = fs.readFileSync("./public/ref-white.png")
            const refWhite = new Uint8Array(refWhiteFile);

            const qrFile = fs.readFileSync("./public/"+product.ItemCode+".png")
            const qr = new Uint8Array(qrFile);
            doc.addImage(qr, "PNG", leftEdge+0, 0, 5, 5)
            doc.addImage(refWhite, "PNG", 3.6 , 2, 1.3, 1.3)


            const logoFile = fs.readFileSync("./public/zeta-negro.png")
            const logo = new Uint8Array(logoFile);
            doc.addImage(logo, "PNG", leftEdge + 1.2 , 4.7, 2.87, 1)
            
            if (body.props.showDate){
                doc.text(body.props.etiquetaDate, leftEdge + 1.2, 6.2);
            }
            
            doc.setFont("Helvetica", "bold")
            doc.setFontSize(16)
            doc.text(product.ItemCode, leftEdge +leftSpace+4, 1, "left")
            doc.setFontSize(16)

            let marcaText = product.FirmCode != -1? product.FirmName : ''
            let marcaLine = 1
            let size = doc.getTextWidth(marcaText)
            FS = 16 
            while (size>3.2){
                if(FS<11){
                    const words = marcaText.split(" ")

                    if (words.length>1){
                        FS = 14
                        doc.setFontSize(FS)
                        let inLines = doc.splitTextToSize(marcaText, 3.3)
                        

                        while (inLines.length>2 || !wordsForWords(words, inLines)){
                            FS -= 0.1
                            doc.setFontSize(FS)
                            inLines = doc.splitTextToSize(marcaText, 3.3)
                        }
                        marcaText = inLines
                        if (inLines.length!=1){
                            marcaLine = 0.5
                        }
                        break
                    }

                }
                
                FS -= 0.1
                doc.setFontSize(FS)
                size = doc.getTextWidth(marcaText)
                
            }
            doc.text(marcaText, rightEdge, marcaLine, "right")
            doc.setFontSize(16)
            
            doc.setFont("Helvetica", "")
            
            let lines = body.props.showPrices ? 3:4
            let FSSTART =  body.props.showPrices? 16 : 32
            FS =FSSTART
            doc.setFontSize(FS)
            
            
            let line = doc.splitTextToSize(product.ItemName, rightEdge - leftEdge - leftSpace -4)

            while (line.length > (FS>FSSTART*0.75? lines: lines+1)){
                FS-=0.1
                doc.setFontSize(FS)
                line = doc.splitTextToSize(product.ItemName, rightEdge - leftEdge - leftSpace -4)
            }
            doc.text(line, leftEdge+leftSpace +4, 1.8, "left")
            doc.setFontSize(16)
            
            if(body.props.showPrices){
                doc.setFont("Helvetica", "bold")
                if (product.Price<=86){
                doc.setFontSize(20)
                }
                doc.text("B.I:", leftEdge+leftSpace +4, 4, "left")
                doc.text("IVA:", leftEdge+leftSpace  +4,5, "left")
                doc.text("PMVP:", leftEdge+leftSpace  +4,6, "left")
                doc.setFont("Helvetica", "")
                
                const refFile = fs.readFileSync("./public/ref.png")
                const ref = new Uint8Array(refFile);
                doc.addImage(ref, "PNG", leftEdge + leftSpace+ 6.2 , 4.1, 1.2, 1.2)


                const showPrice = formatter.format(
                parseFloat(product.Price).toFixed(2)
                );
                const showIVA = formatter.format(
                (parseFloat(product.Price) * 0.16).toFixed(2)
                );
                const showPMVP = formatter.format(
                (parseFloat(product.Price) * 1.16).toFixed(2)
                );
                
                doc.text(showPrice, rightEdge,4, "right")
                if(product.TaxCodeAR == 'IVA_EXE'){
                    doc.setFontSize(15)
                }
                doc.text(product.TaxCodeAR == 'IVA_EXE'? 'EXENTO'  : showIVA, rightEdge,5, "right")
                doc.setFontSize(20)
                doc.text(product.TaxCodeAR == 'IVA_EXE'? showPrice : showPMVP, rightEdge,6, "right")
            }

            
        
            doc.save("./docs/"+product.ItemCode+".pdf")
            await merger.add("./docs/"+product.ItemCode+".pdf");

        }
        await merger.save(`./docs/${pdfName}.pdf`)

    await new Promise((resolve, reject)=>{
        ptp.print("./docs/"+pdfName+".pdf", {
            orientation:"landscape",
            scale:"shrink",
            
            // printDialog:true
        }).then(resolve).catch(reject);
    })
    delete global.window;
    delete global.navigator;
    delete global.btoa;
    }catch(error){
        console.log("what happened?", error)
        e = error.message? error.message :error
    }
    return {
        res:"lol",
        error:e
    }
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
            const location = body.props.location? body.props.location: "TODOS"
            const result = await sql.query(FIRM_AND_COUNT(location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock))
            
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
            const location = body.props.location? body.props.location: "TODOS"

            const result = await sql.query(PRODUCTS_BY_MARCA(params.code, location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock))
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
            const result = await sql.query(PRODUCT_BY_CODE(params.code,body.props.location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock))
            if (result.recordset.length===0) throw "invalid-code-"+params.code
            product = result.recordset[0]


            const url = `http://${process.env.FRONT_IP}/#/consulta/${params.code}`
            const filePath = `./public/${params.code}.png`
             image = `${params.code}.png`

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
            const client = await createClient({
                url: process.env.REDIS_URL
              })
            .on('error', err => console.log('Redis Client Error',  err))
            .connect();
            const response = await createClient({
                url: process.env.REDIS_URL
              })
            .on('error', err => console.log('Redis Client Error',  err))
            .connect();
            const promise = new Promise((resolve,reject)=>{
                response.subscribe("testResponse", (message, channel)=>{
                    const obj = JSON.parse(message)
                    resolve(obj)
                })
            })
            await client.publish("test",JSON.stringify({
                     products:body.products,
                     props:body.props
                }))
            
            const result = await promise
            await client.disconnect();
            await response.disconnect();
            if (result.error){
                e = result.error
            }
            x = result.res

            // const api = axios.create( {baseURL: "http://192.168.0.110:4000"})
            // const r = await api.post("products/jspdf", {
            //     products:body.products,
            //     props:body.props
            // })
            // x = r.data
            // if (x.error){
            //     e = x.error
            // }
        }catch(error){
            console.log("error", error)
            e = error.message
        }
        return {
            x,
            error:e
        }
    },
    JSPDF: JSPDF

}
export {JSPDF}
export default controller