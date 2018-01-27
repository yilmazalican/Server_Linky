const User = require('../model/user');
const Checkin = require('../model/checkin');
const config = require('../config/development');
const jwt = require('jsonwebtoken');
const respond = require('../utils');
const { wrap: async } = require('co');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const rootdir = process.env.PWD;
const only = require('only');
const asncr = require('async');

/**
 * This method is responsible with loading a user into request object.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.load = async(function* (req, res, next) {
    const id = req.params.userid;
    const options = {
        criteria: { _id: id }
    };
    if(id){
        try {
            const user = yield User.load(options);
            if (!user){
                throw new Error();
            }else{
                respond(res,user,200);
                next();
            } 
        } catch (error) {
            return next(new Error("parametered user has not found"))
        }
    }else{
        respond(res,req.user,200);
        next();
    }
  
});

/**
 * This method is responsible with logging in a user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.login = async(function* (req, res, next) {
    const email = req.body.email;
    const options = {
        criteria: { email: email }
    };
    const user = yield User.load(options);
    //user.devices.insert(req.body.token);
    if (!user) return next(new Error('user not found'))
    if (user.checkPassword(req.body.password)) {
        const token = jwt.sign({ user: user.id }, config.jwtsecret, { expiresIn: '23h' });
        return respond(res, { token: token }, 200);
    }
    return next(new Error('invalid credentials'));
});


/**
 * This method is responsible with registering a user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.register = async(function* (req, res, next) {
    const user = new User(req.body);
    try {
        yield user.save();
        respond(res, user, 200);
    }
    catch (err) {
        return next(err);
    }
});

/**
 * This method is responsible with changing password of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.changePassword = async(function* (req, res, next) {
    const oldPassword = req.body.oldpassword;
    const newPassword = req.body.newpassword;
    if (req.user.checkPassword(oldPassword)) {
        try {
            const encryptedPassword = req.user.encryptPassword(newPassword);
            const newUser = yield req.user.update({ hashed_password: encryptedPassword });
            respond(res, { ok: req.user.id }, 200);
        } catch (error) {
            return next(error);
        }
    } else {
        return next(new Error('incorrect password'));
    }
});

/**
 * This method is responsible with registering device with token of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.registerDevice = async(function*(req,res,next){
   const deviceToken = req.body.devicetoken
   if(deviceToken){
    if(req.user.devices.indexOf(deviceToken) == -1 ){
        req.user.devices.push(deviceToken) 
        yield req.user.save()
    }
    return respond(res,{token:deviceToken},200)    
   }else{
       return next(new Error('missing device token'))
   }
})

/**
 * This method is responsible with unregistering device of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.unregisterDevice = async(function*(req,res,next){
    const deviceToken = req.body.devicetoken
    if(deviceToken){
     const index = req.user.devices.indexOf(deviceToken)
     req.user.devices.splice(index,1)
     yield req.user.save()
     return respond(res,{token:deviceToken},200)    
    }else{
        return next(new Error('missing device token'))
    }
 })

 /**
 * This method is responsible with uploading profile image of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.profileImage = function (req, res, next) {
    const name = Date.now();
    const user = req.user;
    const _path = path.join(rootdir, '/profile_images/', user.id);

    var _storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(rootdir, '/profile_images/'));
        },
        filename: function (req, file, cb) {
            if (!fs.existsSync(_path)) {
                fs.mkdirSync(_path);
            }
            cb(null, req.user.id + '/' + name + '.png');
        }
    });
    const upload = multer({ storage: _storage }).single('profile');
    upload(req, res, function (err) {
        if (err) return next(err);
        return res.status(200).json({ ok: "ok" });
    });
};

/**
 * This method is responsible with getting profile image of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.getProfileImage = function (req, res, next) {
    const userId = req.params.userid;
    const imagePath = path.join(rootdir, 'profile_images', userId);
    try {
        const files = currentProfileImage = fs.readdirSync(imagePath);
        res.sendFile(path.join(imagePath, files[files.length - 1]));

    } catch (error) {
        if (error.stack.indexOf('ENOENT')) {
            return next(new Error('cannot find profile image'));
        }
    }

};

/**
 * This method is responsible with editing profile information of the user.
 * @param {any} req - request object
 * @param {any} res - response object
 * @param {any} next - called when next middleware executed.
 */
exports.editProfile = async(function* (req, res, next) {
    try {
        Object.assign(req.user, only(req.body, 'name surname interested about'));
        yield req.user.save();
        return respond(res, req.user, 200);
    } catch (error) {
        return next(new Error('cannot edit profiles'));
    }
    
});




