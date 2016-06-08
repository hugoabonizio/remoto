#!/usr/bin/env node
function generate_token(size) {
  var text = '';
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for( var i=0; i < size; i++ )
    text += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return text;
}

var WebSocket = require('ws')
var ws = new WebSocket('ws://localhost:8080/?type=terminal&token=' + generate_token(32));
var pty = require('pty.js')

var term = pty.fork('bash', [], {
  name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
    ? 'xterm-256color'
    : 'xterm',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME
});

term.on('data', function (data) {
  var message = JSON.stringify({ type: 'OUT', message: data })
  ws.send(message);
});

ws.on('open', function () {
  console.log("connection opened")
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
  console.log('connection closed', e)
  process.exit(1)
})

ws.on('close', function (e) {
  console.log('connection closed', e)
  process.exit(1)
})