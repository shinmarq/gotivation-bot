


var request = require('request'),
	async = require('async'),
	_ = require('underscore'),
	MapResponse = require('../MapResponse'),
	constants = require('../../constants');

const URL = constants.BASE_PATH + constants.API_PATH + "/";

exports.getQuery = function(params, callback) {
	var options = {};
		options = {
			url: URL + "/queries/" + params.queryId,
			qs: _.omit(params,['queryId'])
        }
	request.get(options, function(err, res, body) {
		if(err == null && res.statusCode == constants.SUCCESS) {
			var mapResponse = new MapResponse(body);
			var newBody = mapResponse.mapData();
			callback(null, res, newBody);
		} else {
			callback(err, res, null);
		}
	});
};


exports.getQueryForBot = function(params, callback) {
	var getUrl = '';
	var options = {};
		getUrl = URL + "/queries/bot";
	

	options = {
		url: getUrl,
		qs: _.mapObject( _.omit(params, ['queryId']), function(value, index) {
			return encodeURIComponent(value);
		})
	};

	request.get(options, function(err, res, body) {
		if(err == null && res.statusCode == constants.SUCCESS) {
			var mapResponse = new MapResponse(body);
			var newBody = mapResponse.mapData();
			callback(null, res, newBody);
		} else {
			callback(body, res, null);
		}
	});
};

exports.createQuery = function(params, callback) {
	console.log("Create Query");
	var postUrl = '';
		postUrl = URL + "/queries";
	
	var newParams = _.omit(params, ['queryId']);
	var options = {
		method: 'post',
		body: newParams,
		json: true,
		url: postUrl
	};
	request(options, function(err, res, body) {
		if(err == null && res.statusCode == constants.CREATED) {
			var mapResponse = new MapResponse(body);
			var newBody = mapResponse.mapData();
			callback(null, res, newBody);
		} else {
			callback(err, res, null);
		}
	});
};

exports.updateQuery = function(params, callback) {
	var newParams = _.omit(params, ['queryId']);
	var options = {
			url: URL + "/queries/" + params.queryId,
			method: 'put',
			body: newParams,
			json: true,
		};

	request(options, function(err, res, body) {
		if(err == null && res.statusCode == constants.SUCCESS) {
			var mapResponse = new MapResponse(body);
			var newBody = mapResponse.mapData();
			callback(null, res, newBody);
		} else {
			callback(err, res, null);
		}
	});
};

exports.deleteQuery = function(params, callback) {

};