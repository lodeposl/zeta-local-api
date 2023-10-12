// const sqlite3 = require('sqlite3').verbose();
import sqlite3 from "sqlite3"
const db = new sqlite3.Database("sqlite.db")
function task (){
    db.serialize(() => {
        db.run("CREATE TABLE permissions (name TEXT)");
    
        const stmt = db.prepare("INSERT INTO permissions VALUES (?)");
        stmt.run("imprimir-etiquetas");
        stmt.finalize();

        db.run("CREATE TABLE users (name TEXT, password TEXT, role TEXT, lastlogin DATE)")
        
        const admin = db.prepare("INSERT INTO users VALUES (?, ?, ? ,?)")
        admin.run("admin", "12345", "admin", new Date())
        admin.finalize()
        
        db.each("select rowid from permissions", (err, row)=>{
            console.log("row", row)

            // const perms = db.prepare("INSERT INTO user_permissions VALUES (?, ?)")
            // perms.run(row.rowid, user.rowid)
            // perms.finalize()
        })
        db.run("CREATE table user_permissions (permision INT, user INT)")

        const perms = db.prepare("INSERT INTO user_permissions VALUES (?, ?)")
        perms.run(1,1)
        perms.finalize()
            // db.each("select rowid from users", (err, user)=>{
            //     console.log("user", user)
            //     db.each("select rowid from permissions", (err, row)=>{
            //         console.log("row", row)

            //     })
            // })

        


        // db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
        //     console.log(row.id + ": " + row.info);
        // });
    });
    
    db.close();
}

export {task}