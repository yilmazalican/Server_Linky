/**
 * Authorization Middleware
 * This ensures that req will contain user.
 */
const jwt = require('jsonwebtoken');
const config = require('../config/development');
const User = require('../model/user');
const { wrap: async } = require('co');

/**
 * If any route requires authorization. This middleware is attached on the route.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
var requiresHeader = async(function* (req, res, next) {
    if (req.header && req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        try {
            const decoded = jwt.verify(token, config.jwtsecret).user;
            if (decoded) {
                const options = {
                    criteria: { _id: decoded }
                };   
                user = yield User.load(options);
                if(!user) return next(new Error('user has not found'));
                req.user = user;
                next();
            }
        } catch (err) {
            return next(err);
        }
    }else{
        return next(new Error('missing auth token'));
    }
});

/**
 * This method ensures that the authorized user editing checkins.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
var authCheckin = async(function*(req,res,next){
    if(req.loadedcheckin.user != req.user.id){
        return next(new Error("You can only delete your checkin!"));
    }else{
        next();
    }
});
module.exports = {requiresHeader}