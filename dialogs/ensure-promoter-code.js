var builder = require('botbuilder'),
    partyBot = require('partybot-http-client');
module.exports = {
    Label: 'EnsurePromoterCode',
    Dialog: [
    function (session, args, next) {
        session.dialogData.promoter = args.promoter;
        session.dialogData.organisationId = args.organisationId;
        session.dialogData.event = args.event;
        session.dialogData.eventId = args.eventId;

        if (!session.dialogData.promoter.promoterCode) {
            builder.Prompts.text(session, `Please enter your promoter code for ${session.dialogData.event} now:`);
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            // session.dialogData.profile.name = results.response;
            var params = {
                organisationId: session.dialogData.organisationId,
                promoterCode: results.response
            };
            getPromoterCode(params, function(error, statusCode, body) {
                if(statusCode == 200) {
                    session.dialogData.promoter._id = body._id;
                    session.dialogData.promoter.name = body.name;
                    session.dialogData.promoter.promoterCode = body.promoter_code;
                    session.dialogData.promoter.validCode = true;
                    next();
                } else {
                    next();
                }
            });
        }
        else {
            next();
        }
    },
    function (session, results) {
        if(!session.dialogData.promoter.promoterCode) {
            session.replaceDialog('/ensure-promoter-code', session.dialogData);
        } else {
            session.endDialogWithResult({ response: session.dialogData.promoter });
        }
    }]
}

function getPromoterCode(promoterCode, callback) {
    partyBot.promoters.getPromoterByCode(promoterCode, function(error, response, body) {
        callback(error, response.statusCode, body);
    });
} 