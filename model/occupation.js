const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { wrap: async } = require('co');

const OccupationSchema = new Schema({
    occupations: {type:[String]}
});


OccupationSchema.statics = {
   getOccupations: function(){
    return this.findOne({});
       
   }
}

module.exports = mongoose.model('Occupation', OccupationSchema);