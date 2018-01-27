const jwt = require('jsonwebtoken');
const config = require('../config/development');
const User = require("../model/user")
const model = require('../model/conversation')
const notificationsender = require('../notification/notificationsender')
module.exports = function (io) {
    var sockets = {}


    io.use((socket, next) => {
        var header = socket.request.headers.authorization;
        if (header) {
            const token = header.split(" ")[1];
            try {
                const decoded = jwt.verify(token, config.jwtsecret).user;
                console.log("decoded user: " + decoded)
                if (decoded) {
                    socket.user_id = decoded;
                    sockets[socket.user_id] = socket
                    User.findById(socket.user_id, (err,data)=> {
                        socket.user = data
                        socket.onvc = false
                    })
                    next();
                }
            } catch (err) {
                next(new Error(err.message));
                socket.disconnect();
            }
        } else {
            next(new Error("no auth header has been set"));       
            socket.disconnect();            
        }



    });
    io.on('connection', function (socket) {
        
        socket.on("new message", (msg) => {
                var messageInstance = model.message({
                    author: socket.user_id,
                    message: msg.message,
                    name: socket.user.name + " " + socket.user.surname
                })

                model.conversation.findOneAndUpdate({participants: {$all: [socket.user_id,msg.requesteduserid]}}, {$push: {messages : messageInstance } }, {new: true}, (err,doc) => {
                    for(user of doc.participants){
                        if(sockets[user]){
                            sockets[user].emit("send conversation", JSON.stringify({ "p1":socket.user_id, "p2":msg.requesteduserid, "messages":doc.messages}))              
                            }
                    }
                    if(sockets[msg.requesteduserid]){
                        if (sockets[msg.requesteduserid].onvc == false){
                            sockets[msg.requesteduserid].emit('localchatnotif', JSON.stringify({sender: socket.user.name, msg: msg.message}))
                        }else if(sockets[msg.requesteduserid].onvc != doc._id.toString()){
                            sockets[msg.requesteduserid].emit('localchatnotif', JSON.stringify({sender: socket.user.name, msg: msg.message})) 
                        }    
                    }else{
                        User.findOne({_id: msg.requesteduserid}, (err,doc)=> {
                            notificationsender.sendMessageNotification(socket.user,doc, msg.message)

                        })
                    }
                })
        })

        socket.on("openvc", function(msg){
            model.conversation.findOne(
                {
                    participants: {$all: [socket.user_id,msg.requesteduserid]}
                },
                (err,doc) => {
                    socket.onvc = doc._id.toString()
                }
            )
        })

        socket.on("closevc", function(msg){
             socket.onvc = false
        })

        socket.on("get conversations", (data) => {
            model.conversation.findOne({participants: {$all: [socket.user_id,data.requesteduserid]}}, (err,doc) => {
                socket.emit("send conversation", JSON.stringify({ "p1":socket.user_id, "p2":data.requesteduserid, "messages":doc.messages}))
            })
        })
       
        socket.on('disconnect', function () {
           console.log("disconnected " + socket.user_id);
           socket.disconnect()
           delete sockets[socket.user_id]
            
         });
  });


  
}