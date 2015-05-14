  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // TODO: ADD LOCK/UNLOCK CHAT FUNCTIONS CHAT FUNCTIONS
  //

  var CONNECTION_LOST_MESSAGE = 'Соединение разорвано';
  var RECONNECTION_ATTEMPT = 'Пытаюсь подключиться';
  //var GREET_MSG = "Добро пожаловать";
  var LOGIN_FAILURE = "Не удается авторизоваться в чате.";
  var RECONNECT_MSG = "Переподключились";
  var BAN_INFO = "Вам запрещенно отправлять сообщения еще";
  var SECONDS = "секунд(ы)";
  var JUST_BANNED = "Вас забанили на";

  var authed = false;
  $$chat = {};

  function init(endpoint, token) {

    var socket = io(endpoint);
    start(socket, token);
  }

  function start(socket, token) {

    $$chat.socket = socket;

    // Initialize varibles
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box
    $inputMessage.focus();
   /* var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page*/

    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    //var lastTypingTime;


    // Sets the client's username
    function setUsername (name) {
      username = name;
    }

    function auth(authToken) {
      socket.emit('auth', authToken);
    }

    //function greetUser () {
    //
    //  // Display the welcome message
    //  var message = GREET_MSG;
    //  log(message, {
    //    prepend: true
    //  });
    //
    //}

    //greetUser();
    //setUsername(currentUser || 'Vasya');


    function addParticipantsMessage (data) {
      //var message = '';
      //if (data.numUsers === 1) {
      //  message += "there's 1 scipant";
      //} else {
      //  message += "there are " + data.numUsers + " participants";
      //}
      //log(message);
    }

    // Sends a chat message
    function sendMessage () {
      var message = $inputMessage.val();
      // Prevent markup from being injected into the message
      message = cleanInput(message);
      // if there is a non-empty message and a socket connection
      if (message && connected) {
        $inputMessage.val('');
        //addChatMessage({
        //  username: username,
        //  message: message
        //});
        // tell server to execute 'new message' and send along one parameter
        socket.emit('new message', message);
      }
    }

    // Log a message
    function log (message, options) {
      var $el = $('<li>').addClass('log').text(message);
      addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    function addChatMessage (data, options) {
      console.log('send chat message')
      // Don't fade the message in if there is an 'X was typing'
      var $typingMessages = getTypingMessages(data);
      options = options || {};
      if ($typingMessages.length !== 0) {
        options.fade = false;
        $typingMessages.remove();
      }
      var message = data.message || '';
      var pattern ="^" + username + ",";
      var regExp = new RegExp(pattern);

      //console.log(regExp);
      //console.log(message);
      //console.log(pattern);
      console.log('regexp:');
      console.log(regExp);
      console.log('message:');
      console.log(message);
      console.log('username: ');
      console.log(data.username);


      if ( regExp.test( message ) ) {
        var msgStart = message.split(',')[0].length
        message ='<span class="message-highlight">'+username+'</span>,' + message.slice(msgStart+1);
      }

      var color = getUsernameColor(data.username);
      var timeBreakets = [ "[", "]" ];
      var currentTime = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
      var $currentTimeSpan = $('<span class="username-timestamp"/>')
        .text(timeBreakets.join(currentTime))
        .css('color', color);

      var $usernameDiv = $('<span class="username"/>')
        .text(data.username)
        .css('color', color);

      var $messageBodyDiv = $('<span class="messageBody">')
        .append(message);

      var typingClass = data.typing ? 'typing' : '';
      var $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .addClass(typingClass)
        .append($currentTimeSpan, $usernameDiv, $messageBodyDiv);

      addMessageElement($messageDiv, options);
    }

    //function addAlertMessage(message) {
    //  addChatMessage({
    //    message: message,
    //    username: 'Chat'
    //  })
    //}

    // Adds the visual chat typing message
    function addChatTyping (data) {
      //data.typing = true;
      //data.message = 'is typing';
      //addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping (data) {
      //getTypingMessages(data).fadeOut(function () {
      //  $(this).remove();
      //});
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement (el, options) {
      var $el = $(el);

      // Setup default options
      if (!options) {
        options = {};
      }
      if (typeof options.fade === 'undefined') {
        options.fade = true;
      }
      if (typeof options.prepend === 'undefined') {
        options.prepend = false;
      }

      // Apply options
      if (options.fade) {
        $el.hide().fadeIn(FADE_TIME);
      }
      if (options.prepend) {
        $messages.prepend($el);
      } else {
        $messages.append($el);
      }
      $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput (input) {
      return $('<div/>').text(input).text();
    }

    //// Updates the typing event
    //function updateTyping () {
    //  if (connected) {
    //    if (!typing) {
    //      typing = true;
    //      socket.emit('typing');
    //    }
    //    lastTypingTime = (new Date()).getTime();
    //
    //    setTimeout(function () {
    //      var typingTimer = (new Date()).getTime();
    //      var timeDiff = typingTimer - lastTypingTime;
    //      if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
    //        socket.emit('stop typing');
    //        typing = false;
    //      }
    //    }, TYPING_TIMER_LENGTH);
    //  }
    //}

    // Gets the 'X is typing' messages of a user
    function getTypingMessages (data) {
      return $('.typing.message').filter(function (i) {
        return $(this).data('username') === data.username;
      });
    }

    // Gets the color of a username through our hash function
    function getUsernameColor (username) {
      // Compute hash code

      return "red";
      var hash = 7;
      for (var i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + (hash << 5) - hash;
      }
      // Calculate color
      var index = Math.abs(hash % COLORS.length);
      return COLORS[index];
    }

    // Keyboard events

    $window.keydown(function (event) {
      // Auto-focus the current input when a key is typed
      if (!(event.ctrlKey || event.metaKey || event.altKey)) {
        $inputMessage.focus();
      }
      // When the client hits ENTER on their keyboard

      if (event.which === 13) {
        console.log('keydown event');
        console.log('username: '+ username);
        if (username) {
          sendMessage();
          socket.emit('stop typing');
          typing = false;
        }
      }
    });

    $('.inputMessageBtn').on('click', function() {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      }
      $inputMessage.focus();
    });

    // update status methods

    function setOnline(count) {
      console.log('user cnt:' + count);
      $('.online-cnt').text(count);
    }

    function setGreetMsg(msg) {
      $('.room-msg-span').text(msg);
    }

    //$inputMessage.on('input', function() {
    //  //updateTyping();
    //});

    // Click events

    //// Focus input when clicking anywhere on login page
    //$loginPage.click(function () {
    //  $currentInput.focus();
    //});

    // Focus input when clicking on the message input's border
    $inputMessage.click(function () {
      $inputMessage.focus();
    });

    $(document).on('click', '.username', function(e) {
      console.log('click on login');

      var clickedUsername = e.currentTarget.innerText;
      $$chat.addressMessage(clickedUsername);
    });


    // Socket events

    socket.on('connect', function() {
      console.log('connect happened');
      if (token != null){
        auth(token);
      }
    });

    socket.on('reconnect', function() {
      console.log('reconnect happened');
      log(RECONNECT_MSG);
      connected = true;

    });

    socket.on('reconnecting', function() {
      console.log('reconnect attempt');
      log(RECONNECTION_ATTEMPT);
    });

    // Whenever the server emits 'login', log the login message
    socket.on('login', function (data) {
      connected = true;

      console.log('login happened');
      console.log(data);

      setUsername(data.username);
    });

    socket.on('login failure', function (data) {
      log(LOGIN_FAILURE);
    });

    socket.on('notification', function (data) {
      var type = data.type;
      switch(type) {
        case 'NOTIFY':
        case 'NOTIFICATION':
          log(data.message);
          console.log(data);
          break;
        case 'BANNED':
          var secs = data.seconds;
          log(JUST_BANNED + " " + secs + " " + SECONDS);
          break;
        case 'BAN_INFO':
          var secs = data.seconds;
          log(BAN_INFO + " " + secs + " " + SECONDS);
          break;
        default:
          console.log('undefined type of notification: '+data.type);
          break;
      }
    });



    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function (data) {
      addChatMessage(data);
    });

    //// Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
      //log(data.username + ' joined');
      setOnline(data.numUsers);
    });
    //
    //// Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
      //log(data.username + ' left');
      //addParticipantsMessage(data);
      //removeChatTyping(data);
      setOnline(data.numUsers);
    });
    socket.on('set room data', function (data) {
      setOnline(data.numUsers);
      setGreetMsg(data.roomMsg);
    });
    //
    //// Whenever the server emits 'typing', show the typing message
    //socket.on('typing', function (data) {
    //  //addChatTyping(data);
    //});
    //
    //// Whenever the server emits 'stop typing', kill the typing message
    //socket.on('stop typing', function (data) {
    //  //removeChatTyping(data);
    //});

    socket.on('disconnect', function (data) {
      log(CONNECTION_LOST_MESSAGE);
      connected = false;
      console.log('disconnect happened');
      //setTimeout(reconnect, 1000);
    });


    //function reconnect() {
    //  start(socket, token);
    //}
    $$chat.addressMessage = function(username) {
      $inputMessage.focus();
      var curInpVal = $inputMessage.val() || '';
      var newValue = username + ", " + curInpVal;
      $inputMessage.val(newValue);
    };
    $$chat.claimUser = function(username) {
      socket.emit('complaint', username);
    }
  }

