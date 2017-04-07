

var request = require('request'),
	async = require('async'),
	_ = require('underscore'),
	MapResponse = require('../MapResponse'),
	constants = require('../../constants');

const URL = constants.BASE_PATH + constants.API_PATH + "/";

exports.getuser = function (params, callback) {
	var options = {};
	if (params.userId) {
		options = {
			url: URL + "/users/" + params.userId,
			qs: params
		};
	} else {
		options = {
			url: URL + "/users/",
			qs: params
		};
	}

	request.get(options, function (err, res, body) {
		if (err == null && res.statusCode == constants.SUCCESS) {
			var mapResponse = new MapResponse(body);
			var newBody = mapResponse.mapData();
			callback(null, res, newBody);
		} else {
			callback(err, res, null);
		}
	});
};

exports.createuser = function (params, callback) {
	var postUrl = URL + "/users";
	var newParams = params;
	var options = {
		method: 'post',
		body: newParams,
		json: true,
		url: postUrl
	};

	request(options, function (err, res, body) {
		if (err == null && res.statusCode == constants.SUCCESS) {
			var mapResponse = new MapResponse(body);
			var newBody = mapResponse.mapData();
			callback(null, res, newBody);
		} else {
			callback(err, res, null);
		}
	});
};

exports.updateuser = function (params, callback) {
	var putUrl = URL + "/users/" + params.user;
	var newParams = _.omit(params, ['user']);
	var options = {
		method: 'put',
		body: newParams,
		json: true,
		url: putUrl
	};

	request(options, function (err, res, body) {
		if (err == null && res.statusCode == constants.SUCCESS) {
			var mapResponse = new MapResponse(body);
			var newBody = mapResponse.mapData();
			callback(null, res, newBody);
		} else {
			callback(err, res, null);
		}
	});
};

// exports.sendMessageTousers = function(params, callback) {
// 	var postUrl = URL + "/users/send-message";
// 	var newParams = params;

// 	var options = {
// 		method: 'post',
// 		body: newParams,
// 		json: true,
// 		url: postUrl
// 	};

// 	// console.log(options);
// 	request(options, function(err, res, body){
// 		if(err == null && res.statusCode == constants.SUCCESS) {
// 			var mapResponse = new MapResponse(body);
// 			var newBody = mapResponse.mapData();
// 			callback(null, res, newBody);
// 		} else {
// 			callback(err, res, null);
// 		}
// 	});
// };