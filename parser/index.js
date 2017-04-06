var constants = require('./constants'),
	users = require('./parser/modules/users'),
	auth = require('./parser/modules/auth');
	replies = require('./parser/modules/replies'),
	queries = require('./parser/modules/queries'),
	sender = require('./parser/modules/sender');
    
module.exports.auth = auth;
module.exports.users = users;
module.exports.replies = replies;
module.exports.queries = queries;
module.exports.sender = sender;