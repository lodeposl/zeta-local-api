import qrcode from "qrcode"
import { SAP_DB as sql} from "../../utils/mssql.js"
import fs from "fs"
// import ipp from "ipp"
// import PDFDocument from "pdfkit"
import ptp from "pdf-to-printer";
import axios from "axios"

import { MARCAS, PRODUCT_BY_CODE, FIRM_AND_COUNT, PRODUCTS_BY_MARCA, PRODUCTS_BY_SEARCH } from "./queries.js"
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";


const formatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });

function parsedDate(){
    const today = new Date()
    const day = (today.getDate()).toString()
    const month = (today.getMonth()+1).toString()
    const year = (today.getFullYear()).toString()
    const date = `${day.length==0?"0"+day:day}/${month.length==0?"0"+month:month}/${year}`
    return date
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
            console.log("redirecting")
            const api = axios.create( {baseURL: "http://192.168.0.105:4000"})
            const r = await api.post("products/jspdf", {
                products:body.products,
                props:body.props
            })
            x = r.data
            console.log("x",x)
        }catch(error){
            console.log("error", error)
            e = error
        }
        return {
            x,
            e
        }
    },
    JSPDF: async (body, params)=>{
        let e
        global.window = {document: {createElementNS: () => {return {}} }};
        global.navigator = {};
        global.btoa = () => {};

        console.log("JSING", body)
        // Default export is a4 paper, portrait, using millimeters for units
        try{
            let pdfName = "Bulk "+ (new Date()+"").replace(/:/g,"-")

            const merger = new PDFMerger()

            for (const product of body.products){
                
                const doc = new jsPDF({
                    orientation: "landscape",
                    unit: "cm",
                    format: [15.24, 10.08],
                    
                });
                
                const leftEdge = 1.8
                const leftSpace = 1
                const rightEdge = 12.5
                
                const price=861
                doc.setFontSize(16)
                
                //generate qr
                const url = `http://${process.env.FRONT_IP}/#/consulta/${product.id}`
                const filePath = `./public/${product.id}.png`
  
                if(!fs.existsSync(filePath)){
                    await qrcode.toFile(filePath,url, {
                        version:4,
                        errorCorrectionLevel:"M",
                        color:{
                            light: '#0000'
                        }
                    })
                }


                const qrFile = fs.readFileSync("./public/"+product.id+".png")
                const qr = new Uint8Array(qrFile);
                doc.addImage(qr, "PNG", leftEdge+0, 0, 5, 5)

                const logoFile = fs.readFileSync("./public/zeta-negro.png")
                const logo = new Uint8Array(logoFile);
                doc.addImage(logo, "PNG", leftEdge + 1.2 , 4.7, 2.87, 1)
                
                if (body.props.showDate){
                    doc.text(parsedDate(), leftEdge + 1.2, 6.2);
                }
                
                doc.setFont("Helvetica", "bold")
                doc.text(product.id, leftEdge +leftSpace+4, 1, "left")
                doc.text(product.marca, rightEdge, 1, "right")
                
                doc.setFont("Helvetica", "")
                
                
                let line = doc.splitTextToSize(product.name, rightEdge - leftEdge - leftSpace -4)
                let FS = 16
                while (line.length > 3){
                    FS-=0.1
                    doc.setFontSize(FS)
                    line = doc.splitTextToSize(product.name, rightEdge - leftEdge - leftSpace -4)
                }
                doc.text(line, leftEdge+leftSpace +4, 1.8, "left")
                doc.setFontSize(16)
                
                if(body.props.showPrices){
                    doc.setFont("Helvetica", "bold")
                    if (product.price<=86){
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
                    parseFloat(product.price).toFixed(2)
                    );
                    const showIVA = formatter.format(
                    (parseFloat(product.price) * 0.16).toFixed(2)
                    );
                    const showPMVP = formatter.format(
                    (parseFloat(product.price) * 1.16).toFixed(2)
                    );
                    
                    doc.text(showPrice, rightEdge,4, "right")
                    doc.text(showIVA, rightEdge,5, "right")
                    doc.text(showPMVP, rightEdge,6, "right")
                }

                
            
                doc.save("./docs/"+product.id+".pdf")
                await merger.add("./docs/"+product.id+".pdf");

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
            e = error
        }
        return {
            res:"lol",
            e
        }
    },

}

export default controller