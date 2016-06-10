#!/usr/bin/env node
function generate_token(size) {
  var text = ''
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for( var i=0; i < size; i++ )
    text += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  return text
}

var host
if (process.argv[2])
  host = process.argv[2]
else
  host = 'localhost:8080'

var token = generate_token(32)

var WebSocket = require('ws')
var ws = new WebSocket('ws://' + host + '/?type=terminal&token=' + token)
var pty = require('pty.js')

var term = pty.fork('bash', [], {
  name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
    ? 'xterm-256color'
    : 'xterm',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME
})

ws.on('open', function () {
  console.log("Connection opened with token", token)

  term.on('data', function (data) {
    var message = JSON.stringify({ type: 'OUT', message: data })
    ws.send(message)
  })

  setInterval(function () {
    ws.send(JSON.stringify({ type: 'PING', message: 'PING!' }))
  }, 1000)
})

ws.on('message', function (message) {
  try {
    var obj = JSON.parse(message)
    // console.log(obj)
    term.write(obj.message)
  } catch (ex) {
    console.error(message, ex)
  }
})

ws.on('error', function (e) {
  console.log('Connection closed', e)
  process.exit(1)
})

ws.on('close', function (e) {
  console.log('Connection closed', e)
  process.exit(1)
})