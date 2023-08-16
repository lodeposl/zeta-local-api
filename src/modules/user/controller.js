import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

import { User } from "../../models/users.js"

const controller = {
    login:async ({userName, password},params)=>{
        let error
        let token
        let payload
        try{
            if(!userName) throw "username-required"
            if(!password) throw "password-required"
            
            const user = await User.findOne({name:userName})
            if (!user) throw "nonexistant-user"
            if (!bcrypt.compareSync(password, user.password)) throw "wrong-password"
            user.lastLogin = new Date()
            await user.save()
            payload = {
                name:user.name,
                role:user.role,
                expires: new Date().setHours(new Date().getHours()+4)
            }
            token = jwt.sign(payload, process.env.SECRET, {expiresIn:"4h"})
        }catch(err){
            error = err
        }

        return {
            error,
            token,
            payload

        }
    },
}

export default controller