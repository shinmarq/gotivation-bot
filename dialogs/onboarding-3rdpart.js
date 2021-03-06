

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser'),
    dict = require('../profiledictionary');
moment = require('moment');
const CONSTANTS = require('../constants');
const FB_PAGE_ACCESS_TOKEN = CONSTANTS.FB_PAGE_ACCESS_TOKEN;

module.exports = [
    // function (session) {
    //     console.log(session.userData);
    //     builder.Prompts.time(session, "Alright! What time would you prefer to receive your daily motivation? \n\nEx. 10:00AM");
    // },
    // function (session, results, next) {
    //     session.sendTyping();
    //     if (results.response) {
    //         // session.dialogData.recurrence = builder.EntityRecognizer.resolveTime([results.response]);
    //         var recurrence = builder.EntityRecognizer.resolveTime([results.response]);
    //         //var utc_offset = moment(recurrence).utcOffset(session.userData.user.timezone).format('ZZ');
    //         //console.log('UTCOFFSET SHIT => ', utc_offset)
    //         recurrence = moment.utc(recurrence).add(session.userData.user.timezone * -1, "hours");
    //         recurrence = recurrence.format("HH:mm");
    //         //console.log('RECURRENCE SHIT => ', recurrence)
    //         session.dialogData.recurrence = recurrence;
    //         if (session.dialogData.recurrence) {
    //             session.send("Got it! Please indicate how much the following statements describe you.");
    //             next();
    //         }
    //     }

    // },
    function (session, arg) {
        session.dialogData.onboarded = arg;
        session.sendTyping();
        session.send("Got it! Please indicate how much the following statements describe you.");
        var options = ["Completely", "A lot", "Moderate", "A little", "Not at all"]
        builder.Prompts.choice(session, "When I say I'm going to work out at a specific time, I always follow through.", options, {
            listStyle: builder.ListStyle.button,
            retryPrompt: `It's much easier if you tap button corresponds your answer regarding following work out time.`
        });
    },

    function (session, results, next) {
        session.sendTyping();
        if (results.response) {

            var profile = [];
            var conscientiousness = results.response.entity;
            if (conscientiousness === "A lot" || conscientiousness === "Completely") {
                profile.push(1);
                conscientiousness = "Hard Worker";
            }
            else if (conscientiousness === "Moderate") {
                profile.push(2);
                conscientiousness = "Inconsistent Effort";
            }
            else if (conscientiousness === "Not at all" || conscientiousness === "A little") {
                profile.push(3);
                conscientiousness = "Low Effort";
            }
            session.dialogData.profile = profile;
            session.dialogData.conscientiousness = conscientiousness;
            var options = ["Completely", "A lot", "Moderate", "A little", "Not at all"]
            builder.Prompts.choice(session,
                "I have achieved health goals that took a long time to accomplish.",
                options, {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: `That's not on the options please tap button that corresponds your answer on achieving health goals.`
                });

        }
    },
    function (session, results, next) {
        session.sendTyping();
        var profile = session.dialogData.profile;
        if (results.response) {
            var grit = results.response.entity;
            if (grit === "A lot" || grit === "Completely") {
                profile.push(1);
                grit = "Committed";
            }
            else if (grit === "Moderate") {
                profile.push(2);
                grit = "Semi-Committed";
            }
            else if (grit === "Not at all" || grit === "A little") {
                profile.push(3);
                grit = "Gives Up Easily";
            }
            session.dialogData.profile = profile;
            session.dialogData.grit = grit;
            var options = ["Completely", "A lot", "Moderate", "A little", "Not at all"]
            builder.Prompts.choice(session,
                "I am able to give up temporary pleasures such as sweets in order to pursue my fitness/health goals.",
                options, {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: `That's not on the options please tap button that corresponds your answer on giving up temporary pleasures.`
                });

        }
    },

    function (session, results, next) {
        session.sendTyping();
        if (results.response) {
            var selfcontrol = results.response.entity;
            var profile = session.dialogData.profile;
            if (selfcontrol === "A lot" || selfcontrol === "Completely") {
                profile.push(1);
                selfcontrol = "High Self Control";
            }
            else {
                profile.push(2);
                selfcontrol = "Low Self Control";
            }



            session.dialogData.selfcontrol = selfcontrol;
            var options = ["Completely", "A lot", "Moderate", "A little", "Not at all"]
            builder.Prompts.choice(session,
                "I have control over my own health.",
                options, {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: `That's not on the options please tap button that corresponds your answer on control over your own health.`
                });
        }
    },
    function (session, results, next) {
        session.sendTyping();
        if (results.response) {
            var locusofcontrol = results.response.entity;
            var profile = session.dialogData.profile;
            if (locusofcontrol === "A lot" || locusofcontrol === "Completely") {
                profile.push(1);
                locusofcontrol = "Internally Controlled";
            }
            else {
                profile.push(2)
                locusofcontrol = "Externally Controlled";
            }


            session.dialogData.locusofcontrol = locusofcontrol;
            var options = ["1", "2", "3", "4", "5"]
            builder.Prompts.choice(session,
                `Please select the point on the scale that best describes you:\n
    1) Greatly anticipate feelings of achievement when meeting your goal
    2) Somewhat anticipate feelings of achievement when meeting your goal
    3) Neutral
    4) Somewhat fear failing to meet your goal
    5) Greatly fear failing to meet your goal `,
                options, {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: `That's not on the options please tap button that corresponds your answer regarding scale that best describes you.`
                });

        }
        else {
            session.beginDialog('/default');
        }
    },
    function (session, results, next) {
        session.sendTyping();
        if (results.response) {
            var ffa = results.response.entity;
            var profile = session.dialogData.profile;
            if (ffa === "1" || ffa === "2") {
                profile.push(1);
                ffa = "Glory Seeker";
            }
            else if (ffa === "3") {
                profile.push(2);
                ffa = "Balanced Achiever";
            }
            else if (ffa === "4" | ffa === "5") {
                profile.push(3);
                ffa = "Driven by Fear of Failure";

            }
            session.dialogData.profile = profile;
            session.dialogData.ffa = ffa;
            session.send(`You're just about done! Last one`);
            session.sendTyping();

            builder.Prompts.text(session, `In 1-2 sentences, write WHY you want to achieve your healthy eating and fitness goals? `)

        }
    },
    function (session, results, next) {
        session.sendTyping();
        if (results.response) {
            session.dialogData.construals = results.response
            if (!session.dialogData.onboarded) {
                var msg = new builder.Message(session)
                    .text(`By clicking "I Agree", you agree with our Terms of Service and Privacy Policy`)
                    .addAttachment({
                        contentType: "application/vnd.microsoft.card",
                        content: {
                            "buttons": [
                                {
                                    "type": "openUrl",
                                    "title": "Terms of Service",
                                    "value": "http://gotivation.co/privacy-policy/"
                                },
                                {
                                    "type": "openUrl",
                                    "title": "Privacy Policy",
                                    "value": "http://gotivation.co/terms-of-service/"
                                }

                            ]
                        }
                    });
                session.send(msg);
                console.log(session.dialogData);
                builder.Prompts.choice(session,
                    `Click "I Agree" to proceed`,
                    ["I Agree"], {
                        listStyle: builder.ListStyle.button,
                        retryPrompt: `Your onboarding session will not be saved unless you agree with the Terms of service and Privacy Policy`
                    });
                //Your onboarding session will not be saved unless you agree with the Terms of service and Privacy Policy
            }
            else
                next();
        }
    },
    function (session, results) {
        session.sendTyping();
        var dictionary = dict;
        var profileresult = session.dialogData.profile;
        var userprofile;
        console.log(profileresult);
        for (var x = 0; x < dictionary.profiles.length + 1; x++) {
            if (arraysEqual(dictionary.profiles[x].pairs, profileresult)) {
                userprofile = dictionary.profiles[x].profile;
                break;
            }
        }
        let params = {
            memberid: session.message.address.user.id,
            profiletype: userprofile,
            construals: session.dialogData.construals,
            onboarded: true
        }
        session.sendTyping();
        session.sendTyping();
        parser.member.updatemember(params, function (err, res, body) {
            if (!err && res.statusCode == 200) {
                builder.Prompts.text(session, `You’re all set!  I’ll be ready with your first motivation soon. Let’s do this! `);

                var imgMsg = new builder.Message(session)
                    .attachments([{
                        contentType: "image/jpeg",
                        contentUrl: "http://res.cloudinary.com/hobwovvya/image/upload/v1496212599/First_Step_GTV_jdxnkn.png"
                    }]);

                session.send(imgMsg);

            }
            else {
                console.log(res.statusCode);
                console.log(err);
                session.send('Something went wrong and your session is not saved. Please try again');
                //builder.Prompts.text(session, `You’re all set !  I’ll be ready with your first motivation soon. Let’s do this! `);

            }
        });
    },
    function (session, results) {
        session.sendTyping();
        if (results.response) {
            session.replaceDialog('/default');
        }
    }

    // function getprofile(profileresult) {
    //     var userprofile;
    //     dict.forEach(function (element) {
    //         if (element.pairs === profileresult) {
    //             userprofile = element.profile;
    //             return;
    //         }
    //     }, this);

    //     console.log(userprofile);
    // }


]
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (var i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}


