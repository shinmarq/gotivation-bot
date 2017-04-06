var builder = require('botbuilder'),
    parser = require('./parser'),
    _ = require('underscore');
module.exports = {
    Dialog: [
    function (session, args, next) {
        session.dialogData.coach = args.coach;

        if (!session.dialogData.coach.coachCode) {
            builder.Prompts.text(session, `Please enter your coach code :`);
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            // session.dialogData.profile.name = results.response;
            var params = {
                coach_code: results.response,
            }

            getcoach(params, function(error, statusCode, body) {
                if(statusCode == 200 && body.length > 0) {
                    var result = _.findWhere(body, {coach_code: params.coach_code});
                    session.dialogData.coach._id = result._id;
                    session.dialogData.coach.name = result.name;
                    session.dialogData.coach.coachCode = result.coach_code;
                    session.dialogData.coach.validCode = true;
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
        if(!session.dialogData.coach.coachCode) {
            session.send("Invalid Code!");
            session.replaceDialog('/validatecoach', session.dialogData);
        } else {
            session.endDialogWithResult({ response: session.dialogData.coach });
        }
    }]
}

function getcoach(coachCode, callback) {
    partyBot.coach.getcoachs(coachCode, function(error, response, body) {
        callback(error, response.statusCode, body);
    });
} 