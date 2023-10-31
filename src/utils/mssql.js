import {config} from "dotenv"
config()
import sql from "mssql"

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  server: process.env.DB_HOST,
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    port:parseInt(process.env.DB_PORT),
    encrypt: false, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  } 
};

/**
 * @type {import("mssql").ConnectionPool}
 */
export let SAP_DB
let attempts = 1
function connect (config){
  sql.connect(config)
    .then((res)=>{
    SAP_DB=res
    console.log("connected on the "+attempts+"th attempt to SQLServer on:", `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

  }).catch((error)=>{
    console.log("SQL connection failed on "+attempts+"th attempt", error.message)
    console.log("waiting to retry")
    attempts++
    setTimeout(()=>{connect(config)}, 2000)
  })

}

(()=>{
  // sql.connect(sqlConfig).then((res)=>{
  //   SAP_DB=res
  //   console.log("connected on the "+attempts+"th attempt to SQLServer on:", `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
        

  // }).catch((error)=>{
  //   console.log("SQL connection failed", error)
  //   console.log("waiting to retry")
  //   attempts++
  //   setTimeout()

  // })
  connect(sqlConfig)
})()

