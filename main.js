var http = require("http"), server;
var post = process.argv[2] || 8090;
var skypath = "./skylevel";
var uc = require(skypath);

server = http.createServer(function (request, response) {
    uc(request, response);
}).listen(post);

console.log("run sky server on " + post);
