import {Service} from "node-windows"
import { join } from 'path';
// Create a new service object
const svc = new Service({
  name:'Zeta API',
  description: 'ZETA.CA local API',
  script:'./src/index.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
  //, workingDirectory: '...'
  //, allowServiceLogon: true
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();