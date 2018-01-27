
var apn = require('apn');

let service = new apn.Provider({
    cert: "certificates/cert.pem",
    key: "certificates/key.pem",
  });

/**
 * If any match occurs. This method sends notification the specific devices.
 * @param {User} user - user object
 * @param {User} matchedUser - user object
 */
  var sendMatchNotification = function(user,matchedUser){
    let note = new apn.Notification();
    note.alert = 'You have a new match with ' + matchedUser.name + '.';
    note.badge = 1
    note.contentAvailable = 1
    note.payload = {notificationType: "Match"}
    note.sound = 'ping.aiff'
    service.send(note, user.devices).then( result => {
        console.log("sent:", result.sent.length);
        console.log("failed:", result.failed.length);
        console.log(result.failed);
        service.shutdown()
    });
  }

/**
 * If any messaging occurs between users. This method sends notification the specific devices.
 * @param {User} user - user object
 * @param {any} doc - doc object
 * @param {Message} msg - message object that is related the notification.
 */
var sendMessageNotification = function(user,doc, msg){
    let note = new apn.Notification();
    note.alert = user.name + " says: " + msg;
    note.badge = 1
    note.contentAvailable = 1
    note.payload = {notificationType: "Match"}
    note.sound = 'ping.aiff'
    service.send(note, doc.devices).then( result => {
        console.log("sent:", result.sent.length);
        console.log("failed:", result.failed.length);
        console.log(result.failed);
        service.shutdown()
    });
  }
  
  module.exports = {sendMatchNotification, sendMessageNotification}