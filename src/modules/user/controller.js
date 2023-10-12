import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

import { User } from "../../models/users.js"
import {Config} from "../../models/config.js"

import sqlite3 from "sqlite3"
const sqlite = new sqlite3.Database("sqlite.db")

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
            if (!body.userName) throw "username-required"
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

            sqlite.serialize(async ()=>{
              await new Promise((resolve,reject)=>{
                sqlite.get(`select rowid from users where users.name='${body.user}'`, (err1, user)=>{
                  if (err1) console.log("err1", err1)
                  console.log("user", user)
                  sqlite.run(`delete from user_permissions where user=${user.rowid}`)
                  resolve()
                })
              })
            })
            

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
        let sqlite_users
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
            sqlite_users = await new Promise((resolve,reject)=>{
              sqlite.all("select users.name, users.password, users.role, users.lastlogin, permissions.name as permision from users left outer join user_permissions on users.rowid = user_permissions.user left outer join permissions on permissions.rowid = user_permissions.permision ", (err, rows)=>{
                if (err){
                  console.log("err", err)
                }
                const u1 = {}
                for (const u of rows){
                  if (u1[u.name]){
                    u1[u.name].permissionNumber++
                    if (u.permision){
                      u1[u.name].permissions.push(u.permision)
                      u1[u.name].permissionList.push(u.permision.replace(new RegExp("[-]", "g"), " "))
                    }

                  }else{
                    u1[u.name] = {
                      ...u,
                      permissionNumber:1,
                      roleDisplay:u.role,
                      upermissions:[],
                      permissionList:[]

                    }
                    if (u.permision){
                      u1[u.name].permissions.push(u.permision)
                      u1[u.name].permissionList.push(u.permision.replace(new RegExp("[-]", "g"), " "))
                    }
                  }
                }
                const u2 = []
                for (const k in u1){
                  delete u1[k].permision
                  u2.push(u1[k])
                }
                resolve(u2)
              })
            })
            console.log(sqlite_users)

            

        }catch(err){
            error = err
        }
        return {
            error,
            users,
            sqlite_users
        }
    },
    getPermissions:async (body,params)=>{
        let error
        let permissions
        let sqlite_permisions
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

            sqlite_permisions = await new Promise((resolve,reject)=>{
              sqlite.all("select name from permissions", (err, rows)=>{
                const p = []
                for (const per of rows){
                  p.push({
                    permissions:per.name,
                    displayName:per.name.replace(new RegExp("[-]", "g"), " ")
                  })
                }
                resolve(p)
              })
            })

        }catch(err){
            error = err
        }

        return {
            error,
            permissions,
            sqlite_permisions
        }
    },

}

export default controller