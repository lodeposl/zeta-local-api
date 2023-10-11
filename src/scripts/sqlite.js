// const sqlite3 = require('sqlite3').verbose();
import sqlite3 from "sqlite3"
const db = new sqlite3.Database("sql.db")
function task (){
    db.serialize(() => {
        db.run("CREATE TABLE lorem (info TEXT)");
    
        const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
        for (let i = 0; i < 10; i++) {
            stmt.run("Ipsum " + i);
        }
        stmt.finalize();
    
        db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
            console.log(row.id + ": " + row.info);
        });
    });
    
    db.close();
}

export {task}