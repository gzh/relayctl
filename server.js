const express = require('express');
const ecstatic = require('ecstatic');
const request = require('request');

var app = express();

const baseurl="http://192.168.0.191";
const devauth={"user": "admin", "pass":"vkmodule", "sendImmediately":true };

var status="Unknown";

function updateStatus(){
    request({
        "url": baseurl+"/protect/status.xml",
        "auth": devauth
    },
            (deverr, devres, devbody) => {
                if (deverr) {
                    console.log(deverr);
                    status = "Error";
                    setTimeout(updateStatus, 5000);
                }
                else {
                    //console.log(devbody);
                    status = devbody;
                    setTimeout(updateStatus, 500);
                }
            });
    
}


app.get('/', function(req, res) {
    res.send('Hello Seattle\n');
});

app.get('/status.xml', function(req, res) {
    res.set('Content-Type', 'text/xml');
    res.send(status);
});

app.get("/leds.cgi", function(req,res) {
    console.log(req.query);
    request({"url": baseurl+"/protect/leds.cgi", "auth":devauth, "qs": req.query},
            (deverr, devres, devbody) => {
                if (deverr) {
                    console.log(deverr);
                }
                else {
                    console.log(devbody);
                }
                res.send("ok (maybe)");
            });
});

app.use(ecstatic({
    root: `${__dirname}/static`,
    showdir: true,
}));

updateStatus();

app.listen(8080);
console.log('Listening on port 8080...');
