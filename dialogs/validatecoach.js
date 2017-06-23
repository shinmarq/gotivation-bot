var builder = require('botbuilder'),
    parser = require('../parser');
_ = require('underscore');
module.exports =
    [
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
                if (results.response.toLowerCase() == "no code") {
                    session.dialogData.coach.validCode = false;
                    session.endDialogWithResult({ response: session.dialogData.coach });
                } else {
                    var params = {
                        coach_code: results.response,
                    }
                    //uncomment this is how to get code
                    parser.users.getuser(params, function (error, statusCode, body) {
                        if (!error && body[0].length > 0) {
                            var result = _.findWhere(body, { coach_code: params.coach_code });
                            session.dialogData.coach._id = result._id;
                            session.dialogData.coach.name = result.name;
                            session.dialogData.coach.coachCode = result.coach_code;
                            session.dialogData.coach.image = result.image;
                            session.dialogData.coach.quote = result.quote;
                            session.dialogData.coach.validCode = true;
                            next();
                        } else {
                            console.log(error);
                            next();
                        }
                    });
                }
            }
            else {
                next();
            }
        },
        function (session, results) {
            if (!session.dialogData.coach.coachCode) {
                session.send("Invalid Code! \n\n(You can type 'no code' to proceed)");
                session.replaceDialog('/validatecoach', session.dialogData);
            } else {
                session.endDialogWithResult({ response: session.dialogData.coach });
            }
        }]




// function getcoach(coachCode, callback) {
//     request.get(options, r)
//     parser.coach.getcoach(coachCode, function(error, response, body) {
//         callback(error, response.statusCode, body);
//     });
// } 

