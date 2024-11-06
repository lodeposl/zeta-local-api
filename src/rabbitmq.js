import { connect } from "amqplib";
import { JSPDF } from "./modules/products/controller.js";

let connection      = null
let requestChannel  = null
let responseChannel = null

async function initRabbitmq(){
    try{
        connection = await connect(process.env.RABBITMQ_URI)
    
        connection.on('error', (err) => {
            if (err.message.includes('Connection closed')) {
              console.error('Connection closed, reconnecting...');
              setTimeout(initRabbitmq, 5000); // Retry connection after a delay
            } else {
              console.error('Connection error:', err.message);
            }
          });
      
    
        requestChannel = await connection.createChannel()
        requestChannel.on('close', () => {
            console.error('Channel closed, reconnecting...');
            setTimeout(initRabbitmq, 5000); // Restart the consumer after a delay
        });
        responseChannel = await connection.createChannel()
        responseChannel.on('close', () => {
            console.error('Channel closed, reconnecting...');
            setTimeout(initRabbitmq, 5000); // Restart the consumer after a delay
        });
        console.log("LOLOLO")
        await requestChannel.assertExchange("redirectE", "fanout", {durable:true})
        await requestChannel.assertQueue("redirectQ", {durable:true, exclusive:false})
        await requestChannel.bindQueue("redirectQ", "redirectE", "")
        
        await responseChannel.assertExchange("redirectE:Done", "topic", {durable:true})
        await responseChannel.assertQueue("redirectQ:Done", {durable:true, exclusive:false})
        await responseChannel.bindQueue("redirectQ:Done", "redirectE:Done", "")

        requestChannel.consume("redirectQ", async (msg)=>{
            try {
                const content = JSON.parse(msg.content.toString())
                console.log("content", content)
                const result = await JSPDF(content, {})
                requestChannel.ack(msg)
                responseChannel.publish("redirectE:Done", msg.properties.replyTo, Buffer.from(JSON.stringify(result)))
            }catch(err){
                console.log("Caught in async 4k", err)
                setTimeout(initRabbitmq, 5000)
            }

        })

    }catch(error){
        console.log("Caught in 4k", error)
        setTimeout(initRabbitmq, 5000)
    }

}

export {initRabbitmq}

