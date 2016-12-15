var builder = builder = require('botbuilder'),
	partyBot = require('partybot-http-client'),
	Constants = require('../constants');

module.exports = [
    function (session) {
        var params = {
        	organisationId: Constants.ORGANISATION_ID
        }
        partyBot.sender.getSender(params, function(error, response, body) {

        	if(!error && body.length > 0) {





        		session.beginDialog('/');
        	} else {

        		var createParams = {
        			organisationId: Constants.ORGANISATION_ID,
        			sender: session.message.address.user.id,
        			channel_id: session.message.address.channelId
        		};

        		partyBot.sender.createSender(createParams, function(err, res, bod){



        		});
        		session.beginDialog('/');
        	}
        })
        

        
    }
]