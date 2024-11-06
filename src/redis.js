import { createClient } from 'redis';
import { JSPDF } from './modules/products/controller.js';
console.log("XD", process.env.REDIS_URL, process.env.DO_PRINTING)


export async function initRedis(){
    const client = await createClient(process.env.REDIS_URL)
        .on('error', err => console.log('Redis Client Error',  err))
        .connect();

    const response = await createClient(process.env.REDIS_URL)
    .on('error', err => console.log('Redis Client Error',  err))
    .connect();

    const listener = async (message, channel) => {
        const body = JSON.parse(message)
        const result = await JSPDF(body, {})
        await response.publish("testResponse", JSON.stringify(result))
    }
    await client.subscribe("test", listener)


}