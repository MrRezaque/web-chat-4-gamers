// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socketio = require('./socket.io-master')(server);
var db = require('./database.js');
var port = process.env.PORT || 3001;
var _ = require('lodash');

var MAX_COMPLAINT_CNT = 1;
var BAN_TIME = 1000*60*5;
var config = require('./config.js');

console.log(config);

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
//app.use(express.static(__dirname + '/public'));
//app.use(express.static('/source', __dirname + '/source'));

// Chatroom
var nameSpaces = ['search', 'trade', 'talk'];
for (var ind in nameSpaces) {
  bindNamespace(nameSpaces[ind]);
  console.log('create room: '+nameSpaces[ind]);
}

function bindNamespace(roomName) {
  
  // users which are currently connected to the chat
  var users = {};
  var numUsers = 0;
  var nameSpacePath = '/' + roomName;
  var nio = socketio.of(nameSpacePath);

  nio.on('connection', function (socket) {
    var addedUser = false;
    var path = nameSpacePath;

    // socket.banned = false;



    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
      // we tell the client to execute 'new message'
      console.log('nio new message triggered');
      console.log(path);

      console.log('username: ');
      console.log(socket.username);
      
      console.log('time now:' + Date.now());
      console.log('bunned until: ' + socket.bannedUntil);

      if (!addedUser) {
      	return;
      }

      if (socket.bannedUntil < Date.now() ) {
      	socket.broadcast.emit('new message', {
	        username: socket.username,
	        message: data
      	});
      	socket.emit('new message', {
	        username: socket.username,
	        message: data
      	});
      }
      else {
      	socket.emit('notification', {
      		type: "BAN_INFO",
      		seconds: (socket.bannedUntil - Date.now()) / 1000
      	});
      }
      
    });

    // when the client emits 'add user', this listens and executes
    socket.on('auth', function (token) {
		//request to base
		//
		  db.getUsername(token, authResultHandler);
    });

    function authResultHandler(username, bannedUntil) {
    	if (username != null ) {
        successAuth(username, bannedUntil);
      }
      else {
        failAuth();
      }
    }


    function successAuth(data) {

      console.log('Succeessful Auth! Username is:' + data.username);

      //save id
      socket.databaseId = data.id;
      // we store the username in the socket session for this client
      socket.username = data.username;
      //add banned until mark
      socket.bannedUntil = data.bannedUntil;
      if (!socket.bannedUntil) {
      	socket.bannedUntil = Date.now() - 1;
      }

      socket.complainers = [];

      // add the client's username to the global list
      users[data.username] = socket;
      ++numUsers;
      addedUser = true;

      //say hello to new user

      socket.emit('notification', {
        type: 'NOTIFY',
        message: config.greetings[roomName]
      });

      socket.emit('login', {
        numUsers: numUsers,
        username: data.username
      });


      // echo globally (all clients) that a person has connected
      // socket.broadcast.emit('user joined', {
      //   username: socket.username,
      //   numUsers: numUsers
      // });	
    }

    function failAuth() {
    	//write like 'auth failed'
    	console.log('auth_failed');
    	socket.emit('login failure');
    	socket.disconnect();
    }

    socket.on('complaint', function(username) {
    	if ( addedUser && users[username] ) {
        //get bad boy's  socket
        var abusersSocket = users[username];
        //leave if already banned
        if (abusersSocket.bannedUntil > Date.now()) {
          return;
        }

        abusersSocket.complainers.push(socket.username);
        abusersSocket.complainers = _.unique(abusersSocket.complainers);
        if (abusersSocket.complainers.length >= MAX_COMPLAINT_CNT) {
          banUser(abusersSocket, BAN_TIME);
          abusersSocket.complainers = [];
        }
    	}
    });

    function banUser(socket, time) {
      socket.bannedUntil = Date.now + time;
      db.banUser(socket)
    }

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
      socket.broadcast.emit('typing', {
        username: socket.username
      });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
      socket.broadcast.emit('stop typing', {
        username: socket.username
      });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
      console.log('user disconnected');
      // remove the username from global users list
      if (addedUser) {
        delete users[socket.username];
        --numUsers;

        // echo globally that this client has left
        socket.broadcast.emit('user left', {
          username: socket.username,
          numUsers: numUsers
        });
        addedUser = false;
      }
    });
  });
}