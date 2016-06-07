var server = require('http').createServer(),
    url = require('url')
    WebSocketServer = require('ws').Server
    wss = new WebSocketServer({ server: server })
    express = require('express')
    app = express()
    port = 8080

app.use(express.static('public'))

var connections = []

wss.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true)

  var type = (location.query['type'] == 'terminal') ? 'terminal' : 'remote'
  connections.push({ type: type, conn: ws })

  ws.on('message', function (message) {
    var to = (type == 'remote') ? 'terminal' : 'remote'
    console.log(to, message)

    connections.forEach((c) => {
      if (c.type == to) c.conn.send(message)
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

  // console.log(ws.upgradeReq.headers['type'])
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  // ws.on('message', function incoming(message) {
  //   console.log('received: %s', message);
  // });

  // ws.send('echo 1');
});

server.on('request', app)
server.listen(port, function () { console.log('Listening on ' + server.address().port) })
