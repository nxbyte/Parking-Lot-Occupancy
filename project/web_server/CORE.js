/*
    Developer: Warren Seto
    Project  : 'tcnj-traffic' is an open source web app that displays the status of different parking lots
*/

"use strict"

/* Load content from libraries */
const express = require('express'),
    server = express(),
    io = require('http').Server(server),
    socket = require('socket.io')(io),
    helmet = require('helmet'),
    cron = require('cron').CronJob


/* Setup Front-End */
server.use(require('compression')())
server.set('view engine', 'ejs')
server.set('views', __dirname + '/website')
server.use(express.static(__dirname + '/website'));
server.use(helmet())


/* Connect to internal PostgreSQL database with the following credentials */
const pg = new(require('pg')).Pool({
    user: 'sggiwyzhouaxia',
    password: '239cdda97ab19d2fdf8c773a21a7cec9c5d148fa6a4ca5b287b7bb70ef8c1e59',
    database: 'd2sjk9vhq1d9rt',
    host: 'ec2-174-129-218-106.compute-1.amazonaws.com',
    port: 5432,
    max: 19,
    min: 10,
    idleTimeoutMillis: 60000
})


/* Global Variables that act like caches */
var applicationTitle = '',
    cache_status = [],
    cache_trends = []



/*
 * Endpoint : /internal/base_station
 * Purpose  : socket.io socket connection for (Base Station) <--> (Server) communication
 */
socket.of('/internal/base_station').on('connection', function (connectedDevice) {

    if (connectedDevice.handshake.query.auth != process.env.AUTH_KEY) {
        console.log('Unauthorized Attempt to ' + connectedDevice.handshake.query.name)
        console.log('Auth Key used: ' + connectedDevice.handshake.query.auth)
        console.log('---------------------------')
        connectedDevice.close()
    } else {
        console.log('Access Granted to ' + connectedDevice.handshake.query.name + ' (' + connectedDevice.handshake.query.hwaddr + ')')
    }

    /* Base Station Connected! */
    pg.connect(function (err, client, done) {
        if (err) {
            done()
            console.error('[Database Error] > Cannot Connect to Database', err)
            return
        }

        client.query('UPDATE basestations SET isconnected=$1 where serial=$2;', [true, 'HFPo'], function (err, result) {

            done()

            if (err) {
                console.error('[Database Error] > Cannot Query Database for a given input', err)
                return
            }
        })
    })

    connectedDevice.on('payload', function (payload) {

        // Payload is defined: <4 ASCII String> <Character Type> <Payload>
        // Example (Detection Unit with Serial ABCD is sending the value 10): ABCD=10 

        const client_serial = payload.data.substring(0, 4),
            client_type = payload.data[4],
            client_payload = payload.data.substring(5)

        console.log(client_serial)
        console.log(client_type)
        console.log(client_payload)
        console.log('-------')

        // Update the database with a value from a detection unit
        if (client_type === '=') {

            pg.connect(function (err, client, done) {
                if (err) {
                    done()
                    console.error('[Database Error] > Cannot Connect to Database', err)
                    return
                }

                client.query('SELECT lot, isEntrance FROM detectionunits where serial_id=$1;', [client_serial], function (err, result1) {

                    if (err || result1.rows.length < 1) {
                        done()
                        console.error('[Database Error] > Invalid Serial Number (' + client_serial + ')')
                        return
                    }

                    client.query('SELECT current_capacity FROM parkinglot WHERE num=$1;', [result1.rows[0].lot], function (err, result2) {

                        if (err || result2.rows.length < 1) {
                            done()
                            console.error('[Database Error] > Unable to find Lot Number (' + result1.rows[0].lot + ') for a given serial Number (' + client_serial + ')')
                            return
                        }

                        if (result1.rows[0].isentrance) {
                            result2.rows[0].current_capacity += parseInt(client_payload)
                        } else {
                            result2.rows[0].current_capacity -= parseInt(client_payload)
                        }

                        client.query('UPDATE parkinglot SET current_capacity = $1 WHERE num = $2;', [result2.rows[0].current_capacity, result1.rows[0].lot], function (err, result3) {
                            done()
                        })
                    })
                })
            })
        }

        // Update the database with the battery life of a detection unit
        else if (client_type === '~') {

            pg.connect(function (err, client, done) {
                if (err) {
                    done()
                    console.error('[Database Error] > Cannot Connect to Database', err)
                    return
                }

                client.query('UPDATE detectionunits SET battery = $1 WHERE serial_id = $2;', [parseInt(client_payload), client_serial], function (err, result3) {
                    
                    done()

                    if (err) {
                        console.error('[Database Error] > Invalid Serial Number (' + client_serial + ')')
                        return
                    }
                })
            })
        }

        // Update the database to log errors
        else if (client_type === '>') {

            pg.connect(function (err, client, done) {
                if (err) {
                    done()
                    console.error('[Database Error] > Cannot Connect to Database', err)
                    return
                }

                client.query('UPDATE detectionunits SET log = $1 WHERE serial_id = $2;', [(new Date()).toISOString() + ':' + client_payload, client_serial], function (err, result3) {
                    
                    done()

                    if (err) {
                        console.error('[Database Error] > Invalid Serial Number (' + client_serial + ')')
                        return
                    }
                })
            })
        }

        // Unknown payload type; payload ignored
        else {
            return
        }
    })

    /* Base Station Disconnected... */
    connectedDevice.on('disconnect', function () {

        pg.connect(function (err, client, done) {
            if (err) {
                done()
                console.error('[Database Error] > Cannot Connect to Database', err)
                return
            }

            client.query('UPDATE basestations SET isconnected=$1 where serial=$2;', [false, 'HFPo'], function (err, result) {

                done()

                if (err) {
                    console.error('[Database Error] > Cannot Query Database for a given input', err)
                    return
                }
            })
        })
    })
})



/*
 * Endpoint : /firmware
 * Purpose  : Retrieves a JSON string that points to the latest Base Station firmware
 */
server.get('/firmware', function (input, output) {

    pg.connect(function (err, client, done) {
        if (err) {
            done()
            console.error('[Database Error] > Cannot Connect to Database', err)
            return
        }

        client.query('SELECT firmwareversion, firmwareurl from settings;', function (err, result) {

            done()

            if (err) {
                console.error('[Database Error] > Cannot Query Database for a given input', err)
                return
            }

            return output.json(result.rows[0])
        })
    })
})



/*
 * Endpoint : /debug/:serial
 * Purpose  : Retrieves a JSON string that contains information about a particular detection unit
 */
server.get('/debug/:serial', function (input, output) {

    pg.connect(function (err, client, done) {
        if (err) {
            done()
            console.error('[Database Error] > Cannot Connect to Database', err)
            return
        }

        client.query('SELECT * from detectionunits WHERE serial_id = $1;', [input.params.serial], function (err, result) {

            done()

            if (err) {
                console.error('[Database Error] > Cannot Query Database for a given input', err)
                return
            }

            return output.json(result.rows[0])
        })
    })
})



/*
 * Endpoint : /trend
 * Purpose  : Retrieves a website that shows the trend of all parking lots
 */
server.get('/trend', function (input, output) {
    return output.render('trend', {
        appName: applicationTitle,
        trend_data: JSON.stringify(cache_trends)
    })
})



/*
 * Endpoint : * (All other endpoints)
 * Purpose  : Retrieves a website that shows the current status of all parking lots
 */
server.get('*', function (input, output) {
    return output.render('index', {
        appName: applicationTitle,
        units: cache_status
    })
})



/* 
 * Utility
 * Purpose : Every 5 seconds update the user interface with the current status of all parking lots 
 */
new cron({
    cronTime: '5 * * * * *',
    onTick: function () {

        pg.connect(function (err, client, done) {
            if (err) {
                done()
                console.error('[Database Error] > Cannot Connect to Database', err)
                return
            }

            client.query('SELECT name, current_capacity, max_capacity FROM parkinglot;', function (err, result1) {
                if (err) {
                    done()
                    console.error('[Database Error] > Cannot Query Database for a given input', err)
                    return
                }

                var size = result1.rows.length
                while (size--) {
                    result1.rows[size].current_capacity = Math.max(0, result1.rows[size].max_capacity - result1.rows[size].current_capacity)
                }

                cache_status = result1.rows

                client.query('SELECT * FROM trends;', function (err, result2) {

                    done()

                    if (err) {
                        console.error('[Database Error] > Cannot Query Database for a given input', err)
                        return
                    }

                    cache_trends = [{
                        x: ['5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 AM'],
                        y: [70, 45, 10, 5, 1, 1, 0, 0],
                        type: 'scatter'
                    }];
                })
            })
        })
    },
    start: true,
    timeZone: 'America/New_York',
    runOnInit: true
})



/* 
 * Utility
 * Purpose : Every Day at 1 AM, Reset the occupancy counters for all lots 
 */
new cron({
    cronTime: '0 0 1 * * *',
    onTick: function () {

        pg.connect(function (err, client, done) {
            if (err) {
                done()
                console.error('[Database Error] > Cannot Connect to Database', err)
                return
            }

            client.query('UPDATE parkinglot SET current_capacity=$1 where num=$2;', [0, 1], function (err, result1) {
                client.query('UPDATE parkinglot SET current_capacity=$1 where num=$2;', [0, 2], function (err, result1) {

                    done()
                    
                    if (err) {
                        console.error('[Database Error] > Cannot Query Database for a given input', err)
                        return
                    }
                })
            })
        })
    },
    start: true,
    timeZone: 'America/New_York',
    runOnInit: false
})



/*
 * Utility
 * Purpose : Binding Server Application to either: <ip address>:<env port> or localhost:2000
 */

io.listen(process.env.PORT || '2000', function () {

    pg.connect(function (err, client, done) {
        if (err) {
            done()
            console.error('[Database Error] > Cannot Connect to Database', err)
            return
        }

        client.query('SELECT name from settings;', function (err, result) {

            done()

            if (err) {
                console.error('[Database Error] > Cannot Query Database for a given input', err)
                return
            }

            applicationTitle = result.rows[0].name
        })
    })
})