var express = require('express');
var app = express(); 
var http = require('http');
var io = require('socket.io')(http);
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');

var spawn = require('child_process').spawn;
var proc;
app.use(express.static('stream'));

var sockets = {};
io.on('connection', function(socket){
	sockets[socket.id] = socket;

	socket.on('disconnect',function(){
		delete sockets[socket.id];
	});

	socket.on('start-stream', function(){
  		startStreaming(io);
	})
});

function startStreaming(io){
	var args = ["-w", "640", "-h", "480", "-o", "./stream/image_stream.jpg", "-t", "999999999", "-tl", "100"];
  	proc = spawn('raspistill', args);

  	fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
    	io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
  	});
}

function stopStreaming() {
  if (Object.keys(sockets).length == 0) {
    app.set('watchingFile', false);
    if (proc) proc.kill();
    fs.unwatchFile('./stream/image_stream.jpg');
  }
}

http.createServer(function(req,res){
	if(req.method.toLowerCase() == 'get'){
		var filename = "./index.html"
		fs.readFile(filename, function(err,file){
			if (err){
				res.writeHead(404,{'Content-Type':'text/html'});
				return res.end("404 Not Found")
			}
			res.writeHead(200,{'Content-Type':'text/html'});
			res.write(file);
			return res.end();
		});
	}else if(req.method.toLowerCase() == 'post'){
		//camera start
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields,files){
			res.writeHead(200, { //ver como se insere na pagina existente
	            'content-type': 'text/plain'
	        });
	        var filename = "./stream.html"
			fs.readFile(filename, function(err,file){
				if (err){
					res.writeHead(404,{'Content-Type':'text/html'});
					return res.end("404 Not Found")
				}
				res.writeHead(200,{'Content-Type':'text/html'});
				res.write(file);
				return res.end();
			});
		});
	}
}).listen(8080);