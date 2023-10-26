import { Service } from 'node-windows';

// Create a new service object
const svc = new Service({
  name:'Zeta API',
  script:'./src/index.js',
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

// Uninstall the service.
svc.uninstall();