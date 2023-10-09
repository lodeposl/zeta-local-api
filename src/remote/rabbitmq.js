import { connect} from "amqplib"

import uniqid from "uniqid"
const con = await connect(process.env.RABBITMQ_URI)
const requestChannel = await con.createChannel()
const responseChannel = await con.createChannel()

export  function callListener(eventName, value){
    return new Promise(async (resolve,reject)=>{
        const id = uniqid()
        await responseChannel.assertExchange(eventName+":Done", "topic", {durable:false})
        await responseChannel.assertQueue(eventName+":"+id, {durable:false, exclusive:true})
        await responseChannel.bindQueue(eventName+":"+id, eventName+":Done", id)
        value.requestId = id 
        requestChannel.publish(eventName, id, Buffer.from(JSON.stringify(value)), {replyTo:id})
    
        responseChannel.consume(eventName+":"+id, (msg)=>{
            const content = JSON.parse(msg.content.toString())
            responseChannel.ack(msg)
            responseChannel.cancel(msg.fields.consumerTag)
            responseChannel.deleteQueue(eventName+":"+id)
            resolve(content)
        })
        setTimeout(()=>{
            reject("rabbitmq-timeout")
        },5000)
    })

}