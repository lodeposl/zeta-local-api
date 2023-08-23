import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

import { User } from "../../models/users.js"
import {Config} from "../../models/config.js"

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
                permissions:user.permissions,
                expires: new Date().setHours(new Date().getHours()+4)
            }
            token = jwt.sign(payload, process.env.SECRET, {expiresIn:"24h"})
        }catch(err){
            error = err
        }

        return {
            error,
            token,
            payload

        }
    },
    passwordChange: async(body, params)=>{
        let error
        let success

        try{
            if (!body.user) throw "user-required"
            if (body.auth.name !== "admin" || body.auth.name!=body.user) "cant-modify-user"

            if (!body.newPassword) throw "password-required"

            const user = await User.findOneAndUpdate({name:body.user}, {$set:{
                password: bcrypt.hashSync(body.newPassword,10),
        
            }})
            success = true
        }catch(err){
            error = err.message ? err.message : err
        }

        return {
            error,
            success
        }
    },
    createUser: async(body, params)=>{
        let error
        let success
        try{
            if (!body.userName) throw "userName-required"
            if (!body.password) throw "password-required"
            if (!body.role) throw "role-required"
            if (!body.permissions) throw "permissions-required"

            const config = await Config.findOne({}).lean()
            
            let permissions = body.permissions.filter((i)=> config.permissions.includes(i))

            const user = {
                name:body.userName,
                password:bcrypt.hashSync(body.password, 10),
                role:body.role,
                permissions:permissions
            }
            await User.create(user)
            success = true
        }catch(err){


            error = err.message? err.message : err
        }
        return {
            error,
            success
        }
    },
    permissions: async (body,params)=>{
        let error
        try{
            if(!body.user) throw "user-required"
            if (!body.permissions) throw "permissions-required"
            const config = await Config.findOne({}).lean()
            
            let permissions = body.permissions.filter((i)=> config.permissions.includes(i))
            await User.updateOne({name:body.user}, {$set:{
                permissions:permissions
            }})

            


        }catch(err){
            error = err
        }

        return {
            error,
            token,
            payload

        }
    }
}

export default controller