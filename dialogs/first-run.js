var builder = builder = require('botbuilder'),
	partyBot = require('partybot-http-client'),
	Constants = require('../constants');
const CL = console.log;
module.exports = [
    function (session) {
        CL(session.message.address);
        var params = {
        	organisationId: Constants.ORGANISATION_ID
        }
        partyBot.sender.getSender(params, function(error, response, body) {
        	CL("Getting User");
        	if(!error && body.length > 0) {
        		CL("Sender found");
        		CL(error);
        		CL(response.statusCode);
        		CL(body);

        		session.beginDialog('/');
        	} else {
        		CL("Sender not found");
        		var createParams = {
        			organisationId: Constants.ORGANISATION_ID,
        			sender: session.message.address.user.id,
        			channel_id: session.message.address.channelId
        		};
        		CL("Creating sender");
        		partyBot.sender.createSender(createParams, function(err, res, bod){
        			CL(err);
        			CL(res.statusCode);
        			CL(bod);
        		});
        		session.beginDialog('/');
        	}
        })
        

        
    }
]