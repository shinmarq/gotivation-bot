

var request = require('request'),
	async = require('async'),
	_ = require('underscore'),
	MapResponse = require('../MapResponse'),
	constants = require('../../constants');

const URL = constants.BASE_PATH + constants.API_PATH + "/";

exports.getmember = function (params, callback) {
	console.log('MEMBER ID FROM PARSER', params);
	var options = {};
	if (params.memberid) {
		options = {
			url: URL + "bot/members/" + params.memberid
			//qs: params
		};
	} else {
		options = {
			url: URL + "bot/members/" 
			//qs: params
		};
	}

	request.get(options, function (err, res, body) {
		if (err == null && res.statusCode == constants.SUCCESS) {
			var mapResponse = new MapResponse(body);
			var newBody = mapResponse.mapData();
			callback(null, res, newBody);
		}
		else {
			callback(err, res, null);
		}
	});
};

exports.createmember = function (params, callback) {
	var postUrl = URL + "bot/members";
	var newParams = params;
	var options = {
		method: 'POST',
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

exports.updatemember = function (params, callback) {
	console.log('UPDATEMEMBER', params);
	if(params.memberid){
		var putUrl = URL + "bot/members/" + params.memberid;
	}else{
		var putUrl = URL + "bot/members/";
	}
	// var options = {
	// 		method: 'PUT',
	// 		body: params,
	// 		json: true,
	// 		url: putUrl
	// 	};
	var options = {
		url: putUrl,
		method: 'PUT',
		form: params
	}
	
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

exports.delete = function (params, callback) {

	var putUrl = URL + "bot/members/";
	var options = {
		method: 'DELETE',
		body: params,
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

// exports.sendMessageTomembers = function(params, callback) {
// 	var postUrl = URL + "/members/send-message";
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