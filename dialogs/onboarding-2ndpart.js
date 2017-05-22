

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser'),
    dict = require('../profiledictionary');

const CONSTANTS = require('../constants');
const FB_PAGE_ACCESS_TOKEN = CONSTANTS.FB_PAGE_ACCESS_TOKEN;

module.exports = [
    function (session) {
        builder.Prompts.time(session, "Alright! What time would you prefer to receive your daily motivation? \n\nEx. 10:00AM");
    },
    function (session, results, next) {
        //session.sendTyping();
        if (results.response) {
            // session.dialogData.recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            var recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            recurrence = recurrence.getUTCHours() + ':' + recurrence.getUTCMinutes();
            session.dialogData.recurrence = recurrence;
            if (session.dialogData.recurrence) {
                builder.Prompts.text(session, "Got it! Please indicate how much the following statements describe you.");
                next();
            }
        }

    },
    function (session, results, next) {
        var options = ["Completely", "A lot", "Moderate", "A little", "Not at all"]
        builder.Prompts.choice(session, "When I say I'm going to work out at a specific time, I always follow through.", options, {
            listStyle: builder.ListStyle.button,
            retryPrompt: `It's much easier if you tap button corresponds your answer regarding following work out time.`
        });
    },

    function (session, results, next) {
        //session.sendTyping();
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
        //session.sendTyping();
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
        //session.sendTyping();
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
        //session.sendTyping();
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
        //session.sendTyping();
        if (results.response) {
            var ffa = results.response.entity;
            var profile = session.dialogData.profile;
            if (ffa === "1" || ffa === "2") {
                profile.push(1);
                ffa = "Driven by Fear of Failure";
            }
            else if (ffa === "3") {
                profile.push(2);
                ffa = "Balanced Achiever";
            }
            else if (ffa === "4" | ffa === "5") {
                profile.push(3);
                ffa = "Glory Seeker";
            }
            session.dialogData.profile = profile;
            session.dialogData.ffa = ffa;
            builder.Prompts.text(session, `In 1-2 sentences, write WHY you want to achieve your healthy eating and fitness goals? `)

        }
    },
    function (session, results, next) {
        if (results.response) {
            var msg = new builder.Message(session)
                .addAttachment({
                    contentType: "application/vnd.microsoft.card.adaptive",
                    content: {
                        type: "AdaptiveCard",
                        speak: "<s>Your  meeting about \"Adaptive Card design session\"<break strength='weak'/> is starting at 12:30pm</s><s>Do you want to snooze <break strength='weak'/> or do you want to send a late notification to the attendees?</s>",
                        body: [
                            {
                                "type": "TextBlock",
                                "text": "Adaptive Card design session",
                                "size": "large",
                                "weight": "bolder"
                            },
                            {
                                "type": "TextBlock",
                                "text": "Conf Room 112/3377 (10)"
                            },
                            {
                                "type": "TextBlock",
                                "text": "12:30 PM - 1:30 PM"
                            },
                            {
                                "type": "TextBlock",
                                "text": "Snooze for"
                            },
                            {
                                "type": "Input.ChoiceSet",
                                "id": "snooze",
                                "style": "compact",
                                "choices": [
                                    {
                                        "title": "5 minutes",
                                        "value": "5",
                                        "isSelected": true
                                    },
                                    {
                                        "title": "15 minutes",
                                        "value": "15"
                                    },
                                    {
                                        "title": "30 minutes",
                                        "value": "30"
                                    }
                                ]
                            }
                        ],
                        "actions": [
                            {
                                "type": "Action.Http",
                                "method": "POST",
                                "url": "http://foo.com",
                                "title": "Snooze"
                            },
                            {
                                "type": "Action.Http",
                                "method": "POST",
                                "url": "http://foo.com",
                                "title": "I'll be late"
                            },
                            {
                                "type": "Action.Http",
                                "method": "POST",
                                "url": "http://foo.com",
                                "title": "Dismiss"
                            }
                        ]
                    }
                });
            var msg = new builder.Message(session)
                .addAttachment({
                    contentType: "application/vnd.microsoft.card",
                    content: {
                        "buttons": [
                            {
                                "type": "openUrl",
                                "title": "Go to my site",
                                "value": "https://blogs.msdn.microsoft.com/tsmatsuz"
                            }
                        ]
                    }
                });
            session.send(msg);
        }
    },
    function (session, results) {
        if (results.response.entity != "I Agree") {
            console.log("test");
        }
        else {
            var dictionary = dict;
            var profileresult = session.dialogData.profile;
            var userprofile;

            for (var x = 0; x < dictionary.profiles.length + 1; x++) {
                if (arraysEqual(dictionary.profiles[x].pairs, profileresult)) {
                    userprofile = dictionary.profiles[x].profile;
                    break;
                }
            }
            let params = {
                memberid: session.message.address.user.id,
                name: session.message.address.user.name,
                recurrencetime: session.dialogData.recurrence,
                profiletype: userprofile,
                construals: session.dialogData.construals
            }
            parser.member.updatemember(params, function (err, res, body) {
                if (!err && res.statusCode == 200) {
                    builder.Prompts.text(session, `You’re all set!  I’ll be ready with your first motivation soon. Let’s do this! `);
                }
                else {
                    console.log(err);
                    session.send('Something went wrong and your session is not saved. Please try again');
                }
            });
        }
    },
    function (session, results) {
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
