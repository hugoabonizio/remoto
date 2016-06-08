#!/usr/bin/env node
"use strict";
var server = require('http').createServer(),
    url = require('url'),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: server }),
    express = require('express'),
    app = express(),
    port = process.env.PORT || 8080

app.use(express.static('public'))

var connections = []

function update_terminal_list() {
  var tokens = []
  connections.forEach(function (c) {
    if (c.type == 'terminal')
      tokens.push(c.token)
  })
  connections.forEach(function (c) {
    if (c.type == 'remote')
      c.conn.send(JSON.stringify({ type: "TERMS", message: tokens }))
  })
}

wss.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true)

  var type = (location.query['type'] == 'terminal') ? 'terminal' : 'remote'
  var token = location.query['token']
  connections.push({ type: type, conn: ws, token: token })

  update_terminal_list()

  ws.on('message', function (message) {
    var to = (type == 'remote') ? 'terminal' : 'remote'
    // console.log(message)
    var obj = JSON.parse(message)

    connections.forEach((c) => {
      if (c.type == to) c.conn.send(JSON.stringify({ type: obj.type, message: obj.message }))
    })
  })

  ws.on('close', () => {
    connections.forEach((c) => {
      if (c.conn == ws) {
        var index = connections.indexOf(c)
        if (index > -1)
          connections.splice(index, 1)
      }
    })
  })

  ws.on('error', () => {
    connections.forEach((c) => {
      if (c.conn == ws) {
        var index = connections.indexOf(c)
        if (index > -1)
          connections.splice(index, 1)
      }
    })
  })
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
})

server.on('request', app)
server.listen(port, function () { console.log('Listening on ' + server.address().port) })
