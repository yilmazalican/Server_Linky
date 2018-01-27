const Checkin = require('../model/checkin');
const Match = require('../model/match');
const config = require('../config/development');
const only = require('only');
const { wrap: async } = require('co');
const respond = require('../utils');

/**
 * This method is responsible with getting matches of a user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.get = async(function* (req,res,next){
        const matches = yield Match.loadMatchesOfaUser(req.user._id);
        const object = {"matches": matches }
        respond(res,object,200);
});

