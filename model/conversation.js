const mongoose = require('mongoose')
const Schema = mongoose.Schema
const path = require('path');



const MessageSchema = new Schema({
    name : {type:String},
    author: { type:Schema.Types.ObjectId, ref:'User' },
    message: {type:String},
    createdAt: { type:Date, default: Date.now },
})

const ConversationSchema = new Schema({
  participants: [{type: Schema.Types.ObjectId, ref: 'User' }],
  messages: [MessageSchema],
 })

const conversation = mongoose.model('Conversation', ConversationSchema);
const message = mongoose.model('Message', MessageSchema);

 module.exports = { conversation,message }