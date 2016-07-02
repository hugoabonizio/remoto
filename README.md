# REMOTO
**Remoto** is a remote terminal application with a Web GUI to make remote access as easy as it can.

```
$ npm install remoto -g
```

## Running server

To run **Remoto** server application

```
$ remoto-server -u user -p password
```

You can use a config file called ```remoto.json``` to set configurations. This repository has a ```remoto.json.sample``` as example that can be renamed to ```remoto.json```.

```
// remoto.json
{
  "user": "demo",
  "password": "pass123",
  "port": 3000
}
```

## Running terminal

To run **Remoto** terminal client

```
$ remoto [HOST] [LABEL]
```

You can access (http://remoto-server.herokuapp.com) to test the service:

```
$ remoto remoto-server.herokuapp.com TestServer01
```

## Screenshots
![](http://i.imgur.com/onwnhij.png) ![](http://i.imgur.com/0Pol68N.png)