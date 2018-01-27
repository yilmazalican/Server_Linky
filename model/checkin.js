const mongoose = require('mongoose');
const Match = require("./match");
const chat = require("./conversation")
const Schema = mongoose.Schema;
const { wrap: async } = require('co');
const notificationer = require('../notification/notificationsender')
const CheckInSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    loc: {
        type: [Number],
        index: '2dsphere',
        default: [0, 0]
    },
    range: { type: Number, default: 0 },
    listable: { type: Boolean, default: true },
    near: { type: String },
    isCurrent: { type: Boolean, default: true },
    searchable: { type: Boolean, default: true }

});

CheckInSchema.pre('save', function (next) {
    if (this.isNew) {
        this.constructor.findOne({ isCurrent: true, user: this.user }, function (err, data) {
            if (data) {
                data.isCurrent = false;
                data.searchable = false;
                data.save(function (err, data) {
                    next();
                });
            } else {
                next();
            }

        });
    } else {
        next();
    }
});

CheckInSchema.post('save', function (doc) {
    if (doc.isCurrent == true && doc.searchable == true) {
        doc.constructor.searchForMatch(doc);
    }
});

CheckInSchema.statics = {
    load: function(user){
        return this.findOne({user:user,isCurrent:true});
    },

searchForMatch: async(function* (checkin) {
    const query = yield this.aggregate([
        {
            $geoNear:
                {
                    near: { type: "Point", coordinates: checkin.loc },
                    distanceField: "distance",
                    maxDistance: checkin.range,
                    query: { isCurrent: true, searchable: true },
                    spherical: true
                }
        },
        {
            $redact: {
                $cond: {
                    if: { $lte: ["$distance", checkin.range] },
                    then: "$$KEEP",
                    else: "$$PRUNE"
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            },
        },
        {
            $unwind: "$user"
        },
        {
            $match: {
                $and: [
                    { "user.interested": { $in: checkin.user.interested } },
                    { "user._id": { $ne: checkin.user._id } }

                ]
            }
        }
    ]);
    for (var key of query) {
        const users = [key.user, checkin.user]
        const checkins = [checkin, key];
        const m = new Match({ user: users, checkin: checkins });
        const c = new chat.conversation({participants: users})
        const isMatched = yield m.constructor.loadMatches(users);
        if (isMatched.length == 0) {
            yield m.save();
            yield c.save()
                notificationer.sendMatchNotification(users[0],users[1])
                notificationer.sendMatchNotification(users[1],users[0])
        }
    }
})
}

module.exports = mongoose.model('Checkin', CheckInSchema);

