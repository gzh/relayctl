const express = require('express');
const ecstatic = require('ecstatic');
const expressWs = require('express-ws');
const request = require('request');
const xml2js = require('xml2js');
const bodyParser = require('body-parser');
const fs = require('fs');
const auth = require('http-auth');
const digest = auth.digest({
    realm: "relayctl",
    file: __dirname + "/htdigest.txt"
});

const Observable = require('rxjs/Observable').Observable;
const Observer = require('rxjs/Observer').Observer;
require('rxjs/add/operator/shareReplay');
require('rxjs/add/operator/share');


const serverConfig=JSON.parse(fs.readFileSync("server-config.json"));


const baseurl="http://"+serverConfig.device.address;
const devauth={"user": serverConfig.device.auth[0], "pass":serverConfig.device.auth[1], "sendImmediately":true };

var status={
    error: "Not connected",
    leds: []
};
var orders=[];
var orderId=1;
var timestamp=Date.now();

var wsStatusObserver;
var wsStatusObservable=Observable.create(o => {
    wsStatusObserver=o;
    o.next(status);
}).shareReplay(1);
var wsOrdersObserver;
var wsOrdersObservable=Observable.create(o => {
    wsOrdersObserver=o;
    o.next(orders);
}).shareReplay(1);
var wsTimestampObserver;
var wsTimestampObservable=Observable.create(o => {
    wsTimestampObserver=o;
}).share();


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
                let prev_status=Object.assign({}, status);
                let sendOrders=false;
                let timeout=500;
                let now=Date.now();
                if (deverr) {
                    console.log("No access to the device: "+deverr);
                    status.error = "Network error" ;
                    var expiring=orders.filter((o)=>{ return o.deadline <= now; });
                    orders=orders.filter((o)=>{ return o.deadline > now; });
                    if(expiring.length>0){
                        sendOrders=true;
                        console.log("Some orders has expired while device is inaccessible: "+expiring);
                    }
                    timeout=5000;
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
                            if(!status.since){
                                status.since=[];
                            }
                            for(let k=0; k<8; ++k){
                                if(prev_status.since
                                   && prev_status.since[k]
                                   && prev_status.leds
                                   && (status.leds[k]===prev_status.leds[k])){
                                    //status.since[k]=prev_status.since[k];
                                }
                                else{
                                    status.since[k]=now;
                                }
                            }
                        }
                    });
                    var expiring=orders.filter((o)=>{ return o.deadline <= now; });
                    orders=orders.filter((o)=>{ return o.deadline > now; });
                    if(expiring.length){
                        sendOrders=true;
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
                    timeout=500;
                }
                if(wsOrdersObserver && sendOrders){
                    wsOrdersObserver.next(orders);
                }
                if(wsStatusObserver && !(JSON.stringify(prev_status)===JSON.stringify(status))){
                    wsStatusObserver.next(status);
                }
                if(wsTimestampObserver && ((now.valueOf()-timestamp.valueOf())>=10000)){
                    timestamp=now;
                    wsTimestampObserver.next(timestamp);
                }
                setTimeout(updateStatus, 500);
            });
    
}

var app = expressWs(express()).app;

// setup websocket handler before setting up the auth
app.ws("/ws", function(ws, req){
    console.log("New WebSocket request");
    let subs=[];
    
    subs.push(wsStatusObservable.subscribe(s => {
        console.log("about to send status:", s);
        ws.send(JSON.stringify({"status":s}));
    }));
    subs.push(wsOrdersObservable.subscribe(s => {
        ws.send(JSON.stringify({"orders":s}));
    }));
    subs.push(wsTimestampObservable.subscribe(t => {
        ws.send(JSON.stringify({"timestamp":t}));
    }));
    console.log("subscribed");
    
    ws.on('message', function(msg) {
        console.log(msg);
    });
    ws.on('close', () => {
        console.log("Closing websocket connection");
        subs.forEach(s => { s.unsubscribe(); });
    });
});


app.use(auth.connect(digest));
app.use(bodyParser.json());

function userRoles(user){
    let roles=[];
    Object.keys(serverConfig.roles).forEach(k => {
        if(serverConfig.roles[k].find(u => user==u)){
            roles.push(k);
        }
    });
    return roles;
}
function accessibleViews(user){
    let aviews=[];
    let roles=userRoles(user);
    Object.keys(serverConfig.views).forEach(v => {
        roles.forEach(r => {
            if(serverConfig.views[v].find(x => x===r)){
                aviews.push(v);
            }
        });
    });
    return aviews;
}
function accessibleLeds(user){
    let roles=userRoles(user);
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
    let aviews=accessibleViews(req.user);
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
        "views": aviews,
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
app.get('/timestamp', function(req, res) {
    res.json({timestamp: Date.now()});
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
        wsOrdersObserver.next(orders);
        res.json(orders);
    }
});
app.delete('/orders/led/:led', function(req, res) {
    if(!checkLedsAccessible([req.params.led], req, res)){
        return;
    }
    console.log("Deleting orders for led "+req.params.led);
    orders = orders.filter((order) => { return order.led != req.params.led; });
    wsOrdersObserver.next(orders);
    res.json(orders);
});
app.delete('/orders/:id', function(req, res) {
    let o = orders.find(order => order.id==req.params.id);
    if(o && !checkLedsAccessible([o.led], req, res)){
        return;
    }
    orders = orders.filter((order) => { return order.id != req.params.id; });
    wsOrdersObserver.next(orders);
    res.json(orders);
});
app.delete('/orders', function(req, res) {
    if(!checkLedsAccessible(orders.map(o => o.led), req, res)){
        return;
    }
    orders = [];
    wsOrdersObserver.next(orders);
    res.json(orders);
});

app.use(ecstatic({
    root: `${__dirname}/dist`,
    showdir: true,
    index: 'index.html'
}));

updateStatus();

app.listen(serverConfig.listen.port);
console.log('Listening on port '+serverConfig.listen.port+'...');
