export function callController(controller){
    return (req,res)=>{
        controller(req.body, req.params).then((result)=>{
            res.status(200).json(result)
        }).catch((error)=>{
            console.log("error",error)
            res.status(400).json(error)
        })
    }
}