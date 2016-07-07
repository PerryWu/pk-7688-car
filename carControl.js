
var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/ttyS0", {
    baudrate: 57600
});

var carControl = module.exports = {
    control: httpControl,
    json: httpJson,
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
 *  to: 0~180
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
                    if (parseInt(req.query.to) <= 180) {
                        serialPort.write("sa" + req.query.to);
                    }
                    break;
                case '1':
                    if (parseInt(req.query.to) <= 180) {
                        serialPort.write("sb" + req.query.to);
                    }
                    break;
            }
    }

    return res.json({
        status: 'done',
        messages: 'good'
    });
}


function httpJson(req, res) {
    return res.json({
        status: 'done',
        messages: 'good'
    });
}

function cameraon() {
    var exec = require('child_process').exec;
    var cmd = exec('mjpg_streamer -i "input_uvc.so -r 1280*960 -d /dev/video0" -o "output_http.so -n"');

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
