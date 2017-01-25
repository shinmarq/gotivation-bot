var builder = builder = require('botbuilder'),
	partyBot = require('partybot-http-client'),
	Constants = require('../constants');
module.exports = [
    function (session) {
        var params = {
        	organisationId: Constants.ORGANISATION_ID,
        	sender: session.message.address.user.id
        }
        partyBot.sender.getSender(params, function(error, response, body) {

        	if(!error && response.statusCode == 200) {

                var updateParams = {
                    organisationId: Constants.ORGANISATION_ID,
                    sender: body._id,
                    facebook_page_access_token: Constants.FB_PAGE_ACCESS_TOKEN
                };
                partyBot.sender.updateSender(updateParams, function(err, res, bod){
                    session.beginDialog('/');
                });
        		
        	} else {
        		var createParams = {
        			organisationId: Constants.ORGANISATION_ID,
        			sender: session.message.address.user.id,
        			channel: session.message.address.channelId,
                    facebook_page_access_token: Constants.FB_PAGE_ACCESS_TOKEN
        		};
                partyBot.sender.createSender(createParams, function(err, res, bod){
                    session.beginDialog('/');
                });
        	}
        });        
    }
]
