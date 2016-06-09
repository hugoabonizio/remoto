#!/usr/bin/env node
function generate_token(size) {
  var text = '';
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for( var i=0; i < size; i++ )
    text += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return text;
}

var url
if (process.argv[2])
  url = process.argv[2]
else
  url = 'localhost:8080'

var token = generate_token(32);

var WebSocket = require('ws')
var ws = new WebSocket('ws://' + url + '/?type=terminal&token=' + token);
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
  console.log("Connection opened with token", token)
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