var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
    name:'RelayCtl',
    description: 'Relay control',
    script: require('path').join(__dirname,'server.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
    svc.start();
    console.log("Service installed and started");
});

svc.on('uninstall',function(){
    console.log('Uninstall complete.');
    console.log('The service exists: ',svc.exists);
});

if(process.argv.find(x => x==="install")){
    console.log("Going to install the service");
    svc.install();
}
else if(process.argv.find(x => x==="uninstall")){
    console.log("Going to uninstall the service");
    svc.install();
}
else{
    console.log("Usage: node ntservice.js install OR node ntservice.js uninstall");
}

