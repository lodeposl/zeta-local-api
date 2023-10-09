import cron from "cron"

import pushProducts from "./pushProducts.js"
import pushBrands from "./pushBrands.js"
let jobs = [
    // pushProducts
    // pushBrands
]  

let running = {}
const initJobs = async () => {
    for (const job of jobs) {
        const task = new cron.CronJob(
            await job.time(),
            job.task,
            null,
            false,
            undefined,
            undefined,
            true ,// config.isActive ? true : false
        )

        // if (config.isActive) {
        task.start()
        // }
        running[job.name] = task
    }
}


export { running, initJobs }