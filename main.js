const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/development')
var path = require('path')

var io = require('socket.io')
const app = express()
const server = require('http').createServer(app)
io = io.listen(server)
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname,'profile_images')))


process.env.TZ = 'Turkey'

require("./route")(app)
require("./socket/chat")(io)

server.listen(4000);

connection = mongoose.connect(config.db, { useMongoClient: true })


/**
 * THIS APP IS RUNNING SOCKET-IO ON HTTP PORT BEWARE!
 */