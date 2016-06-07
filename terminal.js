var WebSocket = require('ws')
var ws = new WebSocket('ws://localhost:8080/?type=terminal');
var pty = require('pty.js')

var term = pty.fork('bash', [], {
  name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
    ? 'xterm-256color'
    : 'xterm',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME
});

term.on('data', function(data) {
  ws.send(data);
});

ws.on('open', function () {
  console.log("connection opened")
})

ws.on('message', function (message) {
  term.write(message)
})

ws.on('error', function () {
  console.log('connection closed')
  process.exit(1)
})

ws.on('close', function () {
  console.log('connection closed')
  process.exit(1)
})