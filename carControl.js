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
var servoStopTimer;
var delayTo = 600; // milllseconds
var cameraFps = 'auto';
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
            if(action == 'right' || action == 'left')
                stopTimer = setTimeout(carStop, delayTo/3);
            else
                stopTimer = setTimeout(carStop, delayTo);
            break;
        case 'camera':
            switch (action) {
                case 'on':
                    cameraon(cameraFps);
                    break;
                case 'off':
                    cameraoff();
                    break;
                case 'restart':
                    cameraoff(function() {
                        cameraon(cameraFps);
                    });
                    break;
                case 'setfps':
                    if(!req.query.fps)
                        break;
                    cameraoff(function() {
                        cameraon(req.query.fps);
                        cameraFps = req.query.fps;
                    });
            }
            break;
        case 'servo':
            var target;
            switch (action) {
                case '0':
                    target='sa';
                    break;
                case '1':
                    target='sb';
                    break;
            }
            serialPort.write(target + req.query.to);
	    if(servoStopTimer) {
        	clearTimeout(servoStopTimer);
            }
            servoStopTimer = setTimeout(servoStop, delayTo);
            break;
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

function cameraon(fps, cb) {
    var exec = require('child_process').exec;
    //var cmd = exec('mjpg_streamer -i "input_uvc.so -r 1280*960 -d /dev/video0" -o "output_http.so -n -p 46666"');
    var fpsCmd = '';
    if(fpsCmd != 'auto')
        fpsCmd = ' -f ' + fps;
    var cmd = exec('mjpg_streamer -b -i "input_uvc.so -r 640*480 -d /dev/video0 '+fpsCmd+'" -o "output_http.so -n -p 46666"', cb);
/*
    cmd.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    cmd.stderr.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    cmd.on('close', function(code) {
        console.log('closing code: ' + code);
    });
*/
}

function cameraoff(cb) {
    var exec = require('child_process').exec;
    var cmd = exec('killall mjpg_streamer', cb);
}

cameraoff(function() {
    cameraon(cameraFps);
});
