var builder = require('botbuilder'),
    partyBot = require('partybot-http-client'),
    _ = require('underscore');
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
                promoter_code: results.response,
                event_id: session.dialogData.eventId
            }

            getPromoter(params, function(error, statusCode, body) {
                if(statusCode == 200 && body.length > 0) {
                    var result = _.findWhere(body, {promoter_code: params.promoter_code});
                    session.dialogData.promoter._id = result._id;
                    session.dialogData.promoter.name = result.name;
                    session.dialogData.promoter.promoterCode = result.promoter_code;
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
            session.send("Invalid Code!");
            session.replaceDialog('/ensure-promoter-code', session.dialogData);
        } else {
            session.endDialogWithResult({ response: session.dialogData.promoter });
        }
    }]
}

function getPromoter(promoterCode, callback) {
    partyBot.promoters.getPromoters(promoterCode, function(error, response, body) {
        callback(error, response.statusCode, body);
    });
} 