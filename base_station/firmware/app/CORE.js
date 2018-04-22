/*
    Developer: Warren Seto
    Project  : R1 - Base Station Mini-Server Routing
*/

"use strict"

const fs = require('fs'),
      os = require('os'),
      SETTINGS = JSON.parse(fs.readFileSync('/home/pi/settings.json', 'utf8'))


const socket = require('socket.io-client').connect(SETTINGS.server.url, {
    reconnect: true,
    query: 'auth=' + SETTINGS.server.key + '&name=' + SETTINGS.name + '&hwaddr=' + (os.networkInterfaces()['enxb827eb7e6736'][0].mac || "N/A")
})

socket.on('connect', function () {
    console.log('Connected!')
})

socket.on('disconnect', function () {
    console.log('Disconnected...')
})

const SerialPort = require('serialport'),
    port = new SerialPort(SETTINGS.usb.port, {
        baudRate: SETTINGS.usb.rate
    })

port.on('data', function (data) {
    socket.emit('payload', {
        'data': data.toString('ascii')
    })
})

port.on('error', function (err) {
    console.log('Error: ', err.message)
})

process.stdin.resume() // so the program will not close instantly

function exitHandler(options, err) {

    port.close(function (err) {
        console.log('port closed', err)
    })

    if (err) console.log(err.stack)
    if (options.exit) process.exit()
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {
    cleanup: true
}))

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
    exit: true
}))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {
    exit: true
}))

process.on('SIGUSR2', exitHandler.bind(null, {
    exit: true
}))

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
    exit: true
}))