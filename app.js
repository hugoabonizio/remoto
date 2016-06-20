#!/usr/bin/env node
"use strict"
var server = require('http').createServer()
var url = require('url')
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ server: server })
var express = require('express')
var app = express()
var port = process.env.PORT || 8080
var basicAuth = require('basic-auth-connect')
var argv = require('minimist')(process.argv.slice(2))

if (argv.u && argv.p)
  app.use(basicAuth(argv.u, argv.p))

app.use(express.static(__dirname + '/public'))

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
          type: 'LIST',
          message: conns
        }))
    })
  } catch (ex) {
    check_connections()
  }
}

function check_connections() {
  connections.forEach(c => {
    try {
      if (c.conn.readyState == 3) disconnect(c.conn)
    } catch (ex) {
      disconnect(c.conn)
      console.error(ex, ex.stack)
    }
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
  if (type == 'terminal' && (!token || !label)) {
    try {
      ws.close()
    } catch (ex) {
      console.error(ex, ex.stack)
    } finally {
      return null
    }
  }
  var connection = {
    type: type,
    conn: ws,
    token: token,
    label: label
  }
  connections.push(connection)

  update_terminal_list()

  ws.on('message', function (message) {
    try {
      var to = (type == 'remote') ? 'terminal' : 'remote'
      var obj = JSON.parse(message)

      if (obj.type == 'CONN') {
        connection.token = obj.message
      } else if (obj.type == 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', message: 'PONG!' }))
      } else {
        connections.forEach((c) => {
          try {
            if (c.type == to && c.token == connection.token)
              c.conn.send(JSON.stringify({ type: obj.type, message: obj.message }))
          } catch (e) {
            disconnect(c.conn)
          }
        })
      }
    } catch (ex) {
      console.error(ex, ex.stack)
    }
  })

  ws.on('close', () => {
    disconnect(ws)
  })

  ws.on('error', () => {
    disconnect(ws)
  })
})

server.on('request', app)
server.listen(port, function () { console.log('Listening on ' + server.address().port) })
