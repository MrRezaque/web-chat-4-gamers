// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socketio = require('./socket.io-master')(server);
var db = require('./database.js');
var port = process.env.PORT || 3001;
var _ = require('lodash');
var config = require('./config.js');

var MAX_COMPLAINT_CNT = process.env.MAX_COMPLAINT_CNT || config.ban['max_complaint_cnt'] ||  10;
var BAN_TIME = process.env.BAN_TIME || config.ban['time'] ||   1000*60*5;


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

    ++numUsers;

    // socket.banned = false;
    socket.emit('set room data', {
      numUsers: numUsers,
      roomMsg:  config.greetings[roomName]
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
      // we tell the client to execute 'new message'
      console.log('nio new message triggered');
      console.log(path);

      console.log('username: ');
      console.log(socket.username);
      
      console.log('time now:' + formatDate(new Date()));
      console.log('bunned until: ' + formatDate(socket.bannedUntil));

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
        console.log('banned until:' + (socket.bannedUntil - Date.now()) / 1000);
      	socket.emit('notification', {
      		type: "BAN_INFO",
      		seconds: (socket.bannedUntil - Date.now()) / 1000 >> 0
      	});
      }
      
    });

    // when the client emits 'add user', this listens and executes
    socket.on('auth', function (token) {
		//request to base
		//
		  db.getUsername(token, authResultHandler);
    });

    function authResultHandler(data) {

    	if (data != null ) {
        successAuth(data);
      }
      else {
        failAuth();
      }
    }

    function successAuth(data) {

      console.log('Current users are: ');
      console.log(users);
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

      var oldSocket = users[data.username];
      if (oldSocket) {
        oldSocket.disconnect();
      }

      // add the client's username to the global list
      users[data.username] = socket;

      addedUser = true;

      //say hello to new user

      //socket.emit('notification', {
      //  type: 'NOTIFY',
      //  message: config.greetings[roomName]
      //});

      socket.emit('login', {
        numUsers: numUsers,
        username: data.username
      });


      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('user joined', {
         username: socket.username,
         numUsers: numUsers
      });
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
        console.log('complaint cnt:' + abusersSocket.complainers.length);
        console.log('max complaint: ' + MAX_COMPLAINT_CNT);
        if (abusersSocket.complainers.length >= MAX_COMPLAINT_CNT) {
          console.log('enought votes for ban');
          abusersSocket.emit('notification', {
            type: 'NOTIFY',
            message: config.ban['msg']
          });
          banUser(abusersSocket, BAN_TIME);
          abusersSocket.complainers = [];
        }
    	}
    });

    function banUser(socket, time) {
      socket.bannedUntil = Date.now() + time;
      db.banUser(socket.databaseId, Date.now() + time)
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
      --numUsers;
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
      // remove the username from global users list
      if (addedUser) {
        delete users[socket.username];
        // echo globally that this client has left
        addedUser = false;
      }
    });
  });
}

function formatDate(date) {
  date = new Date(date);
  return [ date.getHours(), date.getMinutes(), date.getSeconds() ].join(':');
}