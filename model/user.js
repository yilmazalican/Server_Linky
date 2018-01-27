const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');


const UserSchema = new Schema({
    name: { type: String, default: '' },
    surname: { type: String, default: '' },
    email: { type: String, default: '', },
    salt: { type: String, default: '' },
    hashed_password: { type: String, default: '' },
    interested: { type: [String] },
    about: { type: String },
    createdAt: {type:Date, default:Date.now},
    devices: {type: [String]}
 });



/**
 * Validations
 */


UserSchema.path('name').validate(function (name) {
    return name.length;
}, 'Name cannot be blank');
UserSchema.path('surname').validate(function (surname) {
    return surname.length;
}, 'surname cannot be blank');
UserSchema.path('email').validate(function (email) {
    return email.length;
}, 'email cannot be blank');
UserSchema.path('hashed_password').validate(function (hashed_password) {
    return hashed_password.length;
}, 'Password cannot be blank');
UserSchema.path('email').validate(function (email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}, 'Email must be in a valid format');

UserSchema.path('email').validate(function (email, fn) {
    const User = mongoose.model('User');
    if (this.isNew || this.isModified('email')) {
      User.find({ email: email }).exec(function (err, users) {
        fn(!err && users.length === 0);
      });
    } else fn(true);
  }, 'Email already exists');

  UserSchema.path('interested').validate(function (interested) {
    return interested.length;
}, 'interests cannot be blank');

/**
 * Virtuals
 */

UserSchema
    .virtual('password')
    .set(function (password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    });


/**
 * Methods
 */

UserSchema.methods = {

    /**
    * Authenticate - check if the passwords are the same
    */

    checkPassword: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },


    /**
     * Encrypt Password
     */

    encryptPassword: function (password) {
        if (!password) return '';
        try {
            return crypto
                .createHmac('sha1', this.salt)
                .update(password)
                .digest('hex');
        } catch (err) {
            return 'cannot hash password';
        }
    },

    /**
     * Make Salt
     */
    makeSalt: function () {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    },
}

/**
 * Statics
 */

UserSchema.statics = {

    /**
     * Load
     */
    load: function (options, cb) {
        return this.findOne(options.criteria)
            .select(options.select)
            .exec(cb);
    },

}



module.exports = mongoose.model('User', UserSchema);