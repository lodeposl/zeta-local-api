import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

import { User } from "../../models/users.js"

const controller = {
    login:async ({userName, password},params)=>{
        if(!userName) throw "username-required"
        if(!password) throw "password-required"

        const user = await User.findOne({name:userName}).lean()
        if (!user) throw "nonexistant-user"
        if (!bcrypt.compareSync(password, user.password)) throw "wrong-password"
        const payload = {
            name:user.name,
            role:user.role
        }
        const token = jwt.sign(payload, process.env.SECRET, {expiresIn:"4h"})
        return {
            token,
        }
    },
}

export default controller