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
    deleteUser: async (body,params)=>{
      let error
      let success
      try{
          if(!body.user) throw "user-required"
          await User.deleteOne({name:body.user})
          success = true
      }catch(err){
          error = err
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
            error
        }
    },
    getUsersList: async (body,params)=>{
        let error
        let users
        try{
            
            users = await User.aggregate(
                [
                    {
                      $match:
                        /**
                         * query: The query in MQL.
                         */
                        {
                          $or:[
                            {
                              role: {
                                $ne: "admin",
                              }
                            },
                            {
                              name:{
                                $eq: body.auth.name
                              }
                            }
                          ]
                        
                        }
                    },
                    {
                      $unwind:
                        /**
                         * path: Path to the array field.
                         * includeArrayIndex: Optional name for index.
                         * preserveNullAndEmptyArrays: Optional
                         *   toggle to unwind null and empty values.
                         */
                        {
                          path: "$permissions",
                          preserveNullAndEmptyArrays:true
                        },
                    },
                    {
                      $addFields:
                        /**
                         * newField: The new field name.
                         * expression: The new field expression.
                         */
                        {
                          permissionList: {
                            $reduce: {
                              input: {
                                $map: {
                                  input: {
                                    $split: ["$permissions", "-"],
                                  },
                                  as: "word",
                                  in: {
                                    $concat: [
                                      {
                                        $toUpper: {
                                          $substr: ["$$word", 0, 1],
                                        },
                                      },
                                      {
                                        $substr: [
                                          "$$word",
                                          1,
                                          {
                                            $strLenCP: "$$word",
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                },
                              },
                              initialValue: "",
                              in: {
                                $concat: ["$$value", " ", "$$this"],
                              },
                            },
                          },
                        },
                    },
                    {
                      $group: {
                        _id: {
                          name: "$name",
                          role: "$role",
                          lastLogin: "$lastLogin",
                        },
                        permissionList: {
                          $addToSet: "$permissionList",
                        },
                        permissions: {
                          $addToSet: "$permissions",
                        },
                      },
                    },
                    {
                      $project:
                        /**
                         * specifications: The fields to
                         *   include or exclude.
                         */
                        {
                          _id: 0,
                          name: "$_id.name",
                          role: "$_id.role",
                          lastLogin: {
                            $dateToString: {
                              format: "%H:%M %d/%m/%Y",
                              date: {
                                $dateFromString: {
                                  dateString: {
                                    $dateToString: {
                                      format:
                                        "%Y-%m-%dT%H:%M:%S.%L",
                                      date: "$_id.lastLogin",
                                    },
                                  },
                                  timezone: "+04:00",
                                },
                              },
                            },
                          },
                          permissions: 1,
                          permissionList: 1,
                          permissionNumber: {
                            $size: "$permissions",
                          },
                          roleDisplay:{
                            $switch: {
                                  branches: [
                                    { case: { $eq: ["$_id.role", "admin"] }, then: "Administrador" },
                                    { case: { $eq: ["$_id.role", "user"] }, then: "Usuario" },
                                    // Add more branches for other role values
                                  ],
                                  default: "Unknown"
                                }
                          }
                        },
                    },
                    {
                      $sort:{
                        role:1
                      }
                    }
                  ])

        }catch(err){
            error = err
        }
        return {
            error,
            users
        }
    },
    getPermissions:async (body,params)=>{
        let error
        let permissions
        try{
            

            permissions=await Config.aggregate([
                {
                  $unwind:
                    {
                      path: "$permissions",
                    },
                },
                {
                  $project:
                    {
                      _id: 0,
                      permissions: 1,
                      displayName: {
                        $reduce: {
                          input: {
                            $map: {
                              input: {
                                $split: ["$permissions", "-"],
                              },
                              as: "word",
                              in: {
                                $concat: [
                                  {
                                    $toUpper: {
                                      $substr: ["$$word", 0, 1],
                                    },
                                  },
                                  {
                                    $substr: [
                                      "$$word",
                                      1,
                                      {
                                        $strLenCP: "$$word",
                                      },
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                          initialValue: "",
                          in: {
                            $concat: ["$$value", " ", "$$this"],
                          },
                        },
                      },
                    },
                },
              ])

        }catch(err){
            error = err
        }

        return {
            error,
            permissions
        }
    },

}

export default controller