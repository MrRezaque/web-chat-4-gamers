/**
 * Created by yar on 03.05.15.
 */

$(function(){
  $.contextMenu({
    selector: '.username',
    callback: function(key, options) {
      console.log('context menu trigger');
      var username;

      switch (key) {
        case "message":
          console.log('message');
          username = this.context.innerText;
          $$chat.addressMessage(username)

          break;
        case "ban":
          console.log('ban');
          username = this.context.innerText;
          $$chat.claimUser(username);

          break;
        default:
          break;
      }

    },
    items: {
      "message": {name: "Обратиться в чате"},
      "ban": {name: "Пожаловаться!"}
    }
  });

});
