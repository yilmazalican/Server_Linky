const express = require('express');
const users = require('./controller/users')
const matches = require('./controller/matches')
const auth = require('./middlewares/authorization');
const checkins = require('./controller/checkins')
const occupations = require('./controller/occupations')
var path = require('path')


module.exports = function (app) {
    /**
     * User Routes
     */
    app.post('/login', users.login);
    app.post('/register', users.register);
    app.post('/changepassword', auth.requiresHeader, users.changePassword);
    app.post('/profileimage', auth.requiresHeader, users.profileImage);
    app.get('/profileimage/:userid', users.getProfileImage);
    app.put('/editprofile', auth.requiresHeader, users.editProfile);
    app.get('/userprofile/:userid', auth.requiresHeader, users.load);
    app.get('/userprofile/', auth.requiresHeader, users.load);

    /**
     * Check-in Routes
     */
    app.get('/checkin/current', auth.requiresHeader, checkins.load, checkins.current);
    app.post('/checkin/create', auth.requiresHeader, checkins.create);
    app.put('/checkin/edit/', auth.requiresHeader, checkins.load, checkins.edit);

    /**
     * Match Routes
     */
    app.get('/match/', auth.requiresHeader, matches.get);


    /**
     * Device Token Routes
     */
    app.put('/registerdevice', auth.requiresHeader, users.registerDevice);
    app.delete('/unregisterdevice', auth.requiresHeader, users.unregisterDevice);
    


    /**
     * Occupations List
     */
    app.get('/occupations', occupations.get);

    /**
     * Error Handling
     */

    /**
     * ATTENTION: HANDLE APPROPIATE STATUS CODES RELATED TO ERRORS!
     */
    app.use(function (err, req, res, next) {
        console.log(err.message);
        if (err.stack.includes('ValidationError')) {
            res.status(422).json({ error: err.message });
            return;
        }
        if (err.name == 'TokenExpiredError' || err.message.search('missing') == 0 || err.name == 'JsonWebTokenError') {
            return res.status(401).json({ error: err.message });
        }
        return res.status(406).json({error: err.message});
    })
}
