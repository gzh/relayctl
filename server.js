const express = require('express');
const ecstatic = require('ecstatic');
const request = require('request');
const xml2js = require('xml2js');
const bodyParser = require('body-parser');
const fs = require('fs');
const auth = require('http-auth');
const digest = auth.digest({
    realm: "relayctl",
    file: __dirname + "/htdigest.txt"
});

const serverConfig=JSON.parse(fs.readFileSync("server-config.json"));


const baseurl="http://"+serverConfig.device.address;
const devauth={"user": serverConfig.device.auth[0], "pass":serverConfig.device.auth[1], "sendImmediately":true };

var status={
    error: "Not connected",
    leds: []
};
var orders=[];
var orderId=1;

function toggleLed(led){
    request({"url": baseurl+"/protect/leds.cgi", "auth":devauth, "qs": {"led":led,"timeout":0}},
            (deverr, devres, devbody) => {
                if (deverr) {
                    console.log("Error while trying to toggle led "+led+": "+deverr);
                }
                else {
                    console.log(devbody);
                }
            });
}
function updateStatus(){
    request({
        "url": baseurl+"/protect/status.xml",
        "auth": devauth
    },
            (deverr, devres, devbody) => {
                if (deverr) {
                    console.log("No access to the device: "+deverr);
                    status.error = "Network error" ;
                    var expiring=orders.filter((o)=>{ return o.deadline <= now; });
                    orders=orders.filter((o)=>{ return o.deadline > now; });
                    if(expiring.length>0){
                        console.log("Some orders has expired while device is inaccessible: "+expiring);
                    }
                    setTimeout(updateStatus, 5000);
                }
                else {
                    //console.log(devbody);
                    xml2js.parseString(devbody, (err, res) => {
                        if(err){
                            console.log(devbody);
                            status.error = "Cannot parse xml: "+err;
                        }
                        else
                        {
                            status.error=null;
                            status.leds=[
                                1*res.response.led0[0],
                                1*res.response.led1[0],
                                1*res.response.led2[0],
                                1*res.response.led3[0],
                                1*res.response.led4[0],
                                1*res.response.led5[0],
                                1*res.response.led6[0],
                                1*res.response.led7[0],
                            ];
                        }
                    });
                    var now=Date.now();
                    var expiring=orders.filter((o)=>{ return o.deadline <= now; });
                    orders=orders.filter((o)=>{ return o.deadline > now; });
                    if(expiring.length){
                        expiring.forEach((order) => {
                            console.log("About to execute order: ", order);
                            if(order.command == status.leds[order.led]){
                                console.log("The led "+order.led+" is already in requested position "
                                            +order.command);
                            }
                            else {
                                toggleLed(order.led);
                            }
                        });
                    }
                    setTimeout(updateStatus, 500);
                }
            });
    
}

var app = express();
app.use(auth.connect(digest));
app.use(bodyParser.json());

function accessibleLeds(user){
    let roles=[];
    Object.keys(serverConfig.roles).forEach(k => {
        if(serverConfig.roles[k].find(u => user==u)){
            roles.push(k);
        }
    });
    let accessible=[];
    roles.forEach(role => {
        serverConfig.device.acls[role].forEach(a => {
            if(!isNaN(parseFloat(a)) && isFinite(a)){
                accessible.push(a);
            }
            else{
                accessible=accessible.concat(serverConfig.device.groups[a]);
            }
        });
    });
    return accessible;
}
function checkLedsAccessible(leds, req, res){
    let accessible = accessibleLeds(req.user);
    let ret=true;
    leds.forEach(led => {
        if(accessible.findIndex(x => x==led)<0){
            res.status(403);
            res.send("You do not have access to led "+led);
            ret=false;
        }
    });
    return ret;
}

app.get('/meta', function(req, res) {
    let accessible=accessibleLeds(req.user);
    let aleds=[];
    let agroups=[];
    accessible.forEach(a => aleds.push({"index": a, "name": serverConfig.device.leds[a]}));
    aleds.forEach(a => {
        Object.keys(serverConfig.device.groups).forEach(g => {
            if(serverConfig.device.groups[g].findIndex(x => x==a.index)>=0){
                a["group"]=g;
                agroups.push(g);
            }
        });
    });
    agroups.sort();
    agroups=agroups.filter((value, index, self) => { return self.indexOf(value) === index;}); // uniq
    let agroupsFull={};
    agroups.forEach(g => agroupsFull[g]=serverConfig.groups[g]);
    res.json({
        "groups": agroupsFull,
        "leds": aleds,
    });
});
app.get('/status', function(req, res) {
    res.json(status);
});
app.get('/orders', function(req, res) {
    res.json(orders);
});
// ?led=number[&timeout=number][&command=number]
app.post('/orders', function(req, res) {
    var id=orderId++;
    if(!req.query.led){
        res.status(400);
        res.send("URL parameter led should be specified");
    }
    else {
        if(!checkLedsAccessible([1*req.query.led], req, res)){
            return;
        }
        var order={
            id: id,
            led: 1*req.query.led,
            deadline: Date.now()+(req.query.timeout?1000*req.query.timeout:0),
            command: req.query.command?(1*req.query.command):-1
        };
        orders.push(order);
        res.json(orders);
    }
});
app.delete('/orders/led/:led', function(req, res) {
    if(!checkLedsAccessible([req.params.led], req, res)){
        return;
    }
    console.log("Deleting orders for led "+req.params.led);
    orders = orders.filter((order) => { return order.led != req.params.led; });
    res.json(orders);
});
app.delete('/orders/:id', function(req, res) {
    let o = orders.find(order => order.id==req.params.id);
    if(o && !checkLedsAccessible([req.params.led], req, res)){
        return;
    }
    orders = orders.filter((order) => { return order.id != req.params.id; });
    res.json(orders);
});
app.delete('/orders', function(req, res) {
    if(!checkLedsAccessible(orders.map(o => o.led), req, res)){
        return;
    }
    orders = [];
    res.json(orders);
});

app.use(ecstatic({
    root: `${__dirname}/dist`,
    showdir: true,
    index: 'index.html'
}));

updateStatus();

app.listen(8080);
console.log('Listening on port 8080...');
