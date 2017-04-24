var constants = require('../constants'),
	member = require('./modules/member'),
	category = require('./modules/category'),
	users = require('./modules/users'),
// auth = require('./modules/auth'),
// replies = require('./modules/replies'),
 queries = require('./modules/queries');
// sender = require('./modules/sender');

// module.exports.auth = auth;
module.exports.users = users;
// module.exports.replies = replies;
module.exports.queries = queries;
module.exports.member = member;
module.exports.category = category;