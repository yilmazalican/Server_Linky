const Checkin = require('../model/checkin');
const config = require('../config/development');
const only = require('only');
const { wrap: async } = require('co');
const respond = require('../utils');

/**
 * This method is responsible with loading currentcheckin of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.load = async(function*(req,res,next){
    const user = req.user;
    req.currentCheckin = yield Checkin.load(user);
    if(!req.currentCheckin){
        return next(new Error("No current checkin found for the user"));
    }
    return next();
})

/**
 * This method is responsible with getting currentcheckin of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.current = async(function*(req,res,next){
     return respond(res,req.currentCheckin,200);
});

/**
 * This method is responsible creating chechkin for a user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.create = async(function*(req,res,next){
    const user = req.user;
    if(!user) throw new Error("authed user not found");
    if(req.body.range && req.body.loc.length == 2 ){
        const checkin = new Checkin(only(req.body, 'loc range near'));
        checkin.user = user;
        try{
            yield checkin.save();
            return respond(res,{ok:checkin.id},200);        
        }catch(error){
            return next(error);
        }
    }else{
        return next(new Error("Fill fields properly!"))
    }
});

/**
 * This method is responsible with destroying checkin of a user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.destroy = async(function*(req,res,next){
    try{
        const loadedCheckinId = req.loadedcheckin.id;
        yield req.loadedcheckin.remove();
        if(req.user.currentcheckin == req.loadedcheckin.id){
            req.user.searchable = false;
            yield req.user.save();            
        }
        return respond(res,{ok:loadedCheckinId},200);
    }catch(error){
        return next(error);
    }
});

/**
 * This method is responsible with editing currentcheckin of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.edit = async(function*(req,res,next){
    try{

            Object.assign(req.currentCheckin,only(req.body, 'range searchable'));
            req.currentCheckin.user = req.user
            yield req.currentCheckin.save();
            return respond(res,{ok:req.currentCheckin},200);  
        
    }catch(error){
        return next(error);
    }
});


/**
 * This method is responsible with changing listable feature of the currentcheckin of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.listable = async(function*(req,res,next){
    req.loadedcheckin.listable = false;
    try{
        yield req.loadedcheckin.save();
        return respond(res,{ok:req.loadedcheckin.id},200); 
    }catch(err){
        return next(err);
    }
});