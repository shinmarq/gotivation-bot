

var request = require('request'),
	async = require('async'),
	_ = require('underscore'),
	MapResponse = require('../MapResponse'),
	constants = require('../../constants');

const URL = constants.BASE_PATH + constants.API_PATH + "/";

exports.getcategory = function (params, callback) {
	var options = {};
	if (params.categoryId) {
		options = {
			url: URL + "/category/" + params.categoryId,
			qs: params
		};
	} else {
		options = {
			url: URL + "/category/",
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

exports.createcategory = function (params, callback) {
	var postUrl = URL + "/category";
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

exports.updatecategory = function (params, callback) {
	var putUrl = URL + "/category/" + params.member;
	var newParams = _.omit(params, ['category']);
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