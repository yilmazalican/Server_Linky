const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { wrap: async } = require('co');

const MatchSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    user: { type: [Schema.Types.ObjectId], ref: 'User' },
    checkin: {type: [Schema.Types.ObjectId], ref: 'Checkin'}
});


MatchSchema.statics = {
    loadMatches: function(users) {
       return this.find({
            $or:
                [
                    {
                        "user": { $eq: [users[0], users[1]] }
                    },
                    {
                        "user": { $eq: [users[1], users[0]] }
                    }
                ]
        });
    },

    loadMatchesOfaUser: async(function*(cuser){
        const query = yield this.aggregate([

            { 
                $match : {
                    "user" : cuser
                }
                
            },
            { 
                $unwind :"$user"
                
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind : "$user"
            },
            { 
                $match : {
                    "user._id" : { $ne:cuser }
                }
                
            },
            {
                $lookup: {
                    from: "checkins",
                    localField: "checkin",
                    foreignField: "_id",
                    as: "checkin"
                }
            },
            { 
                $unwind :"$checkin"
                
            },
            { 
                $match : {
                    "checkin.user" : { $eq:cuser }
                }
                
            },
            {
                 $project: {"checkin": 1, "user": 1, "_id": 0, "createdAt": 1}
                    
                     
            }
        ]);
        return query;
    })


}



module.exports = mongoose.model('Match', MatchSchema);