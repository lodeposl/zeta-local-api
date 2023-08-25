import jwt from "jsonwebtoken"
export function callController(controller){
    return async (req,res)=>{
        let response = {

        }
        try{
            const data = await controller(req.body, req.params)
            response.data = data
        }catch(err){
            response.error = err
        }
        
        res.status(200).json(response)
    }
}

export function isAuth(req,res,next){
    let error
    let auth
    if (!req.headers.authorization) error = "auth-required"
    try {
        auth = jwt.verify(req.headers.authorization, process.env.SECRET)
    }catch(err){
        error = err.message
    }
    if (error){
        res.status(200).json({error})
    }else{
        req.body.auth = auth
        next()
    }
}

export function checkRole(roles){
    return (req, res, next)=>{
        if (roles.indexOf(req.body.auth.role)<0){
            res.status(200).json({
                error:"role-unauthorized"
            })
        }else{
            next()
        }
    }
}

export function checkPermissions(permissions){
    return (req, res, next)=>{
        let hasAll = true
        for (const permReq of permissions){
            if(req.body.auth.permissions.indexOf(permReq)<0){
                hasAll = false
            }
        }
        if (!hasAll){
            res.status(200).json({
                error:"not-enough-permissions"
            })
        }else{
            next()
        }
    }
}