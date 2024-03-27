import dotenv from "dotenv"
dotenv.config()
import { initializeApp,cert, getApp  } from "firebase-admin/app";
import jsonDev from "../zeta-store-dev-e571e-firebase-adminsdk-u3l2l-ede77ad8a8.json" assert {type:"json"}

const jsonProd = {}

export const firebase = initializeApp({
    credential:cert(process.env.NODE_ENV =='production'? jsonProd: jsonDev),
    storageBucket:"zeta-store-dev-e571e.appspot.com"
})
