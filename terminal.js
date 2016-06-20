#!/usr/bin/env node
var WebSocket = require('ws')
var pty = require('pty.js')

function generate_token(size) {
  var text = ''
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for( var i=0; i < size; i++ )
    text += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  return text
}

var host, label
if (process.argv[2])
  host = process.argv[2]
else
  host = 'localhost:8080'

if (process.argv[3])
  label = process.argv[3]
else
  label = 'REMOTO terminal'

var token = generate_token(32)
var ws

function check() {
  if (!ws || ws.readState == 3) connect()
}

function connect() {
  ws = new WebSocket('ws://' + host + '/?type=terminal&token=' + token + '&label=' + label)

  var term

  ws.on('open', function () {
    console.log("Connection opened at http://%s/#%s", host, token)

    term = pty.fork('bash', [], {
      name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
        ? 'xterm-256color'
        : 'xterm',
      cols: 160,
      rows: 36,
      cwd: process.env.HOME
    })

    term.on('data', function (data) {
      var message = JSON.stringify({ type: 'OUT', message: data })
      try {
        ws.send(message)
      } catch (ex) {
        console.error(ex)
      }
    })

    var ping = setInterval(function () {
      try {
        ws.send(JSON.stringify({ type: 'PING', message: 'PING!' }))
      } catch (ex) {
        clearInterval(ping)
        console.error(ex)
      }
    }, 1000)
  })

  ws.on('message', function (message) {
    try {
      var obj = JSON.parse(message)
      if (obj.type == 'IN') {
        term.write(obj.message)
      }
    } catch (ex) {
      console.error(message, ex)
    }
  })

  ws.on('error', function (e) {
    console.log('Connection error', e)
    ws = null
    // setTimeout(check, 1000)
  })

  ws.on('close', function (e) {
    // console.log('Connection closed', e)
    ws = null
    setTimeout(check, 1000)
  })
}

connect()
// setInterval(check, 5000)