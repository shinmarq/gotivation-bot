var constants = require('../constants'),
	member = require('./modules/member'),
	category = require('./modules/category'),
	users = require('./modules/users'),
	queries = require('./modules/queries');
	messenger = require('./modules/messenger');

	
module.exports.users = users;
module.exports.queries = queries;
module.exports.member = member;
module.exports.category = category;
module.exports.messenger = messenger;