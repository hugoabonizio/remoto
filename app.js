var server = require('http').createServer(),
    url = require('url')
    WebSocketServer = require('ws').Server
    wss = new WebSocketServer({ server: server })
    express = require('express')
    app = express()
    port = 8080

app.use(express.static('public'))

// app.use(function (req, res) {
//   res.send({ msg: "hello" });
// });

// var connections = {
//   terminal: [],
//   remote: []
// }

var connections = []

function remove_conn(conn) {
  var index = connections.indexOf(conn)
  if (index > -1)
    connections.splice(index, 1)
}

var i = 0

function relisten() {
  // connections.terminal.forEach(function (terminal) {
  //   terminal.on('message', function (message) {
  //     console.log('chegou', ++i)
  //     if (message == 'ping') return terminal.send('pong')
  //       connections.remote.forEach((remote) => {
  //         try {
  //           console.log("sending to remote (", connections.remote.length, ")", message)
  //           remote.send(message)
  //         } catch (ex) {
  //           remove_conn(connections.remote, remote)
  //         }
  //       })
  //   })
  // })

  // connections.remote.forEach(function (remote) {
  //   remote.on('message', function (message) {
  //     if (message == 'ping') return remote.send('pong')
  //       connections.terminal.forEach((terminal) => {
  //         try {
  //           console.log("sending to terminal (", connections.terminal.length, ")", message)
  //           terminal.send(message)
  //         } catch (ex) {
  //           remove_conn(connections.terminal, terminal)
  //         }
  //       })
  //   })
  // })
  connections.forEach((connection) => {
    connection.conn.on('message', function (message) {
      var to
      if (connection.type == 'remote')
        to = 'terminal'
      else
        to = 'remote'

      console.log('sending', connection.type, message)
      connections.forEach((c) => {
        console.log('senting to', to)
        if (c.type == to) c.conn.send(message)
      })
    })
  })
}

wss.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true)
  // console.log(location)

  if (location.query['type'] == "terminal") {
    // connections.terminal.push(ws)
    connections.push({ type: 'terminal', conn: ws });
    console.log('terminal', connections.length)
  } else if (location.query['type'] == "remote") {
    // connections.remote.push(ws)
    connections.push({ type: 'remote', conn: ws });
    console.log('remote', connections.length)
  }

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

  // console.log(ws.upgradeReq.headers['type'])
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  // ws.on('message', function incoming(message) {
  //   console.log('received: %s', message);
  // });

  // ws.send('echo 1');
  relisten()
});

server.on('request', app)
server.listen(port, function () { console.log('Listening on ' + server.address().port) })
