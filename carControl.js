var os = require('os');
var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/ttyS0", {
    baudrate: 57600
});

var carControl = module.exports = {
    control: httpControl,
    json: httpJson,
}

var stopTimer;
var delayTo = 1000; // milllseconds

function carStop() {
    serialPort.write('st');
}

function servoStop() {
    serialPort.write('ss');
}

/*
 * cmd: car
 *  action: forward, right, left, back, stop
 *
 * cmd: camera
 *  action: on, off
 *
 * cmd: servo
 *  action: 0, 1
 *  to: b, f
 *
 */
function httpControl(req, res) {
    var cmd = req.query.cmd;
    var action = req.query.action;
    console.log('httpControl', cmd);
    if (!cmd) {
        return res.json({
            status: 'error',
            messages: 'Wrong inputs'
        });
    }

    switch (cmd) {
        case 'car':
            // 'fo', 'ri', 'le', 'ba', 'st'
            serialPort.write(action.substring(0, 2));
            if(stopTimer) {
                clearTimeout(stopTimer);
            }
            stopTimer = setTimeout(carStop, delayTo);
            break;
        case 'camera':
            switch (action) {
                case 'on':
                    cameraon();
                    break;
                case 'off':
                    cameraoff();
                    break;
            }
            break;
        case 'servo':
            switch (action) {
                case '0':
                    serialPort.write("sa" + req.query.to);
                    break;
                case '1':
                    serialPort.write("sb" + req.query.to);
                    break;
            }
    }

    return res.json({
        status: 'done',
        messages: 'done'
    });
}

function httpJson(req, res) {
    var info = os.networkInterfaces();
    if (!info['apcli0']) {
        return res.json({
            status: 'error',
            messages: 'interface error!?'
        });
    }
    var ip, mac;
    for(var i in info['apcli0']) {
        var inf = info['apcli0'][i];
        if(inf.family == 'IPv4') {
            ip = inf.address;
            mac = inf.mac;
        }
    }
    return res.json({
        status: 'done',
        messages: {ip: ip, mac: mac, name: 'car-7688'}
    });
}

function cameraon() {
    var exec = require('child_process').exec;
    var cmd = exec('mjpg_streamer -i "input_uvc.so -r 1280*960 -d /dev/video0" -o "output_http.so -n -p 46666"');

    cmd.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    cmd.stderr.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    cmd.on('close', function(code) {
        console.log('closing code: ' + code);
    });
}

function cameraoff() {
    var exec = require('child_process').exec;
    var cmd = exec('killall mjpg_streamer');

    cmd.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    cmd.stderr.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    cmd.on('close', function(code) {
        console.log('closing code: ' + code);
    });
}
