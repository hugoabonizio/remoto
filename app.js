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
  try {
    var conns = []
    connections.forEach(function (c) {
      if (c.type == 'terminal')
        conns.push([c.label, c.token])
    })
    connections.forEach(function (c) {
      if (c.type == 'remote')
        c.conn.send(JSON.stringify({
          type: "LIST",
          message: conns
        }))
    })
  } catch (ex) {
    check_connections()
  }
}

function check_connections() {
  connections.forEach(c => {
    if (c.conn.readyState == 3) disconnect(c.conn)
  })
}

function disconnect(ws) {
  connections.forEach((c) => {
    if (c.conn == ws) {
      var index = connections.indexOf(c)
      if (index > -1)
        connections.splice(index, 1)
    }
  })
  update_terminal_list()
}

wss.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true)

  var type = (location.query['type'] == 'terminal') ? 'terminal' : 'remote'
  var token = location.query['token']
  var label = location.query['label']
  var connection = {
    type: type,
    conn: ws,
    token: token,
    label: label
  }
  connections.push(connection)

  update_terminal_list()

  ws.on('message', function (message) {
    var to = (type == 'remote') ? 'terminal' : 'remote'
    // console.log(message)
    var obj = JSON.parse(message)

    if (obj.type == 'CONN') {
      connection.token = obj.message
    } else if (obj.type == 'PING') {
      ws.send(JSON.stringify({ type: 'PONG', message: 'PONG!' }))
    } else {
      connections.forEach((c) => {
        if (c.type == to && c.token == connection.token)
          c.conn.send(JSON.stringify({ type: obj.type, message: obj.message }))
      })
    }
  })

  ws.on('close', () => {
    disconnect(ws)
  })

  ws.on('error', () => {
    disconnect(ws)
  })
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
})

server.on('request', app)
server.listen(port, function () { console.log('Listening on ' + server.address().port) })
