const Occupation = require('../model/occupation')
const respond = require('../utils');
const { wrap: async } = require('co');

/**
 * This method is responsible with getting occupations array.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.get = async(function*(req,res,next){
    const occupations = yield Occupation.getOccupations();
    respond(res,occupations,200);

});