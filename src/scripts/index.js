const args = process.argv
console.log("args", args)
if (args.length<3){
    console.error("no script specified")
}
import(`./${args[2]}.js`).then(({task})=>{

    task(args)
}).catch((error)=>{
    console.error(`can not find module ${error}`)

})

