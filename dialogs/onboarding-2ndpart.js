

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser'),
    dict = require('../profiledictionary');
moment = require('moment');
const CONSTANTS = require('../constants');
const FB_PAGE_ACCESS_TOKEN = CONSTANTS.FB_PAGE_ACCESS_TOKEN;

module.exports = [
    // function (session) {//6/29/17 for option of daily,weekly or 3x a week
    //     var options = ["Daily", "Weekly", "3x a week"]
    //     builder.Prompts.choice(session,
    //         "How often you want to receive the motivation?",
    //         options, {
    //             listStyle: builder.ListStyle.button,
    //         });
    // },
    function (session) {
        session.dialogData.origintext = session.message.text;
        session.beginDialog('/setTimezone',{prompt: "I need your timezone before we proceed. Which city do you live in?"});
    },
    function (session, results) {
        session.send(`Thanks! I have your current time as %s`,results.response);
        var changetime = /^Change_Time|change time|Change time/i.test(session.dialogData.origintext);
        if (changetime) {
            var params = {
                memberid: session.message.address.user.id
            }
            parser.member.getmember(params, function (error, response, getbody) {
                if (!error && response.statusCode == 200) {
                    var membercategory = getbody[0].categories;
                    if (membercategory.length == 0) {
                        session.endConversation('Please select first a category.');
                    } else {
                        builder.Prompts.time(session, "What time would you prefer to receive your daily motivation? \n\nEx. 7:45PM");
                    }
                } else {
                    console.log('there is error...', response);
                }
            });

        } else {
            builder.Prompts.time(session, "What time would you prefer to receive your daily motivation? \n\nEx. 10:15AM");
        }

    },
    function (session, results, next) {
        session.sendTyping();
        if (results.response) {
            // session.dialogData.recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            var recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            //var utc_offset = moment(recurrence).utcOffset(session.userData.user.timezone).format('ZZ');
            //console.log('UTCOFFSET SHIT => ', utc_offset)
            console.log(session.userData.timeZoneData);
            var offset = session.userData.timeZoneData.rawOffset;
            var concattime = moment(recurrence).format("hh:mm:ss a")
            recurrence = moment.utc(recurrence).add(offset * -1, "seconds");
            recurrence = recurrence.format("HH:mm");
            //console.log('RECURRENCE SHIT => ', recurrence)
            session.dialogData.recurrence = recurrence;
            if (session.dialogData.recurrence) {
                let params = {
                    memberid: session.message.address.user.id,
                    recurrencetime: session.dialogData.recurrence,
                    updatetype: "time"
                }
                session.sendTyping();
                parser.member.updatemember(params, function (err, res, body) {
                    if (!err && res.statusCode == 200) {
                        if (body.profiletype == '' || body.profiletype == undefined || body.profiletype == null) {
                            session.replaceDialog('/onboarding-3rdpart', body.onboarded);
                        }
                        else {
                            session.sendTyping();
                            builder.Prompts.text(session, `No problem! I'll send your motivation at ${results.response.entity} each day.`)
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


