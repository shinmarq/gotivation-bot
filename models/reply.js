var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// schema
var replySchema = new Schema({
    intent: Stirng, 
    entity: String,
    value: String    
});

module.exports = mongoose.model('Reply', eventSchema);