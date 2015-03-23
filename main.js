/*
 main.js
*/

var http = require('http');
var sky  = require('./sky');
var server = http.createServer(function (request, response) {
  sky(request, response);
});

server.listen(8090,'127.0.0.1');
