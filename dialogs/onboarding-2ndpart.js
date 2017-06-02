

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser'),
    dict = require('../profiledictionary');
moment = require('moment');
const CONSTANTS = require('../constants');
const FB_PAGE_ACCESS_TOKEN = CONSTANTS.FB_PAGE_ACCESS_TOKEN;

module.exports = [
    function (session) {
        builder.Prompts.time(session, "Alright! What time would you prefer to receive your daily motivation? \n\nEx. 10:00AM");
    },
    function (session, results, next) {
        session.sendTyping();
        if (results.response) {
            // session.dialogData.recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            var recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            //var utc_offset = moment(recurrence).utcOffset(session.userData.user.timezone).format('ZZ');
            //console.log('UTCOFFSET SHIT => ', utc_offset)
           var concattime = moment(recurrence).format("hh:mm:ss a")
            recurrence = moment.utc(recurrence).add(session.userData.user.timezone * -1, "hours");
            recurrence = recurrence.format("HH:mm");
            //console.log('RECURRENCE SHIT => ', recurrence)
            session.dialogData.recurrence = recurrence;
            if (session.dialogData.recurrence) {
                let params = {
                    memberid: session.message.address.user.id,
                    recurrencetime: session.dialogData.recurrence
                }
                session.sendTyping();
                parser.member.updatemember(params, function (err, res, body) {
                    if (!err && res.statusCode == 200) {
                        if (body.profiletype == '') {
                            session.replaceDialog('/onboarding-3rdpart');
                        }
                        else {
                            session.sendTyping();
                            builder.Prompts.text(session, `OK, your motivation have been rescheduled every ${recurrence}`);
                        }

                    }
                    else {
                        console.log(res.statusCode);
                        console.log(err);
                        session.send('Something went wrong and your session is not saved. Please try again');

                    }
                });
            }
        }
    },
    
    function (session, results) {
        session.sendTyping();
        if (results.response) {
            session.replaceDialog('/default');
        }
    }

]


