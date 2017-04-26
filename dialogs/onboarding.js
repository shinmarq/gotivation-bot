

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser');
const CONSTANTS = require('../constants');
const FB_PAGE_ACCESS_TOKEN = CONSTANTS.FB_PAGE_ACCESS_TOKEN;

module.exports = [
    function (session, args, next) {
        console.log(args);
        session.dialogData.coach_id = args.coach === undefined ? "" : args.coach._id;
        session.dialogData.category = args.category || "";
        session.beginDialog('/first-run', session.dialogData);

    },

    function (session, results, next) {
        session.dialogData.category = results.response.category;
        var options = {
        }
        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getcategory, options, msg),
            formatBody,
            sendMessage
        ],
            function (err, msg, selectString) {
                if (err) {
                    session.send(err);
                    session.reset();
                }
                else {
                    session.send('Pick the fitness category I can help you with.');
                    builder.Prompts.choice(session, msg, selectString, { retryPrompt: `Select from the given categories` });
                }
            }

        );

        function getcategory(organisationId, msg, callback) {
            parser.category.getcategory(organisationId, function (err, res, body) {
                if (!err && res.statusCode == 200) {
                    if (body.length > 0) {
                        callback(null, body, msg);
                    } else {
                        callback("No categories yet", [], null);
                    }
                }
                else {
                    callback(body, res.statusCode, []);
                }
            });
        }

        function formatBody(body, msg, callback) {

            var attachments = [];
            var selectString = [];

            body.map(function (value, index) {
                var exist = false;
                var arr = session.dialogData.category;
                if (arr === undefined) {
                    exist = false;
                }
                else {
                    arr.forEach(function (element) {
                        if (element == value._id) {
                            exist = true;
                            return;
                        }
                    }, this);
                }
                if (!exist) {
                    selectString.push('select:' + value._id);
                    attachments.push(
                        new builder.HeroCard(session)
                            .title(value.name)
                            .images([
                                builder.CardImage.create(session, value.image)
                                    .tap(builder.CardAction.showImage(session, value.image)),
                            ])
                            .buttons([
                                builder.CardAction.imBack(session, "select:" + value._id, value.name)
                            ])
                    );
                }
            });
            callback(null, msg, attachments, selectString);
        }

        function sendMessage(msg, attachments, selectString, callback) {
            msg
                .textFormat(builder.TextFormat.xml)
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(attachments);
            callback(null, msg, selectString);
        }

    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.category = results.response.entity.split(':')[1];

            builder.Prompts.confirm(session, `Would you like to select another categories?`);
        } else {
            session.replaceDialog('/default');
        }
    },
    function (session, results, next) {
        //var choice = results.response ? true : false;
        if (results.response) {
            session.beginDialog('/onboarding', session.dialogData);
        }
        else {
            // console.log(session.dialogData);
            session.beginDialog('/first-run', session.dialogData);
        }
    },
    function (session, results, next) {
        // var options = [
        //     "7:30am", "11:30am", "4:30pm"
        // ]
        builder.Prompts.time(session, "Alright! What time would you prefer to receive your daily motivation?");
        // builder.Prompts.choice(session, "Alright! What time would you prefer to receive your daily motivation?", options, {
        //     listStyle: builder.ListStyle.button,
        //     retryPrompt: `For now let's stick with the given time options.`
        // });
    },

    function (session, results, next) {
        session.sendTyping();
        console.log(results.response);

        if (results.response) {
            // session.dialogData.recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            session.dialogData.recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            console.log(session.dialogData.recurrence);
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
        session.sendTyping();
        if (results.response) {
            console.log(results.response);
            var conscientiousness = results.response.entity;
            if (conscientiousness === "A lot" || conscientiousness === "Completely")
                conscientiousness = "Hard Worker";
            else if (conscientiousness === "Moderate")
                conscientiousness = "Inconsistent Effort";
            else if (conscientiousness === "Not at all" || conscientiousness === "A little")
                conscientiousness = "Low Effort";

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
        if (results.response) {
            var grit = results.response.entity;
            if (grit === "A lot" || grit === "Completely")
                grit = "Committed";
            else if (grit === "Moderate")
                grit = "Semi-Committed";
            else if (grit === "Not at all" || grit === "A little")
                grit = "Gives Up Easily";

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

            if (selfcontrol === "A lot" || selfcontrol === "Completely")
                selfcontrol = "High Self Control";
            else if (selfcontrol === "Not at all" || selfcontrol === "A little" || selfcontrol === "Moderate")
                selfcontrol = "Low Self Control";



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
            if (locusofcontrol === "A lot" || locusofcontrol === "Completely")
                locusofcontrol = "In Control";
            else if (locusofcontrol === "Not at all" || locusofcontrol === "A little")
                locusofcontrol = "Out Of My Control";


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
            if (ffa === "1" || ffa === "2")
                ffa = "Driven by Fear of Failure";
            else if (ffa === "3")
                ffa = "Balanced Achiever";
            else if (ffa === "4" | ffa === "5")
                ffa = "Glory Seeker";

            session.dialogData.ffa = ffa;
            builder.Prompts.text(session, `In 1-2 sentences, write WHY you want to achieve your healthy eating and fitness goals? `)

        }
    },
    function (session, results, next) {
        session.sendTyping();

        if (results.response) {
            session.dialogData.construals = results.response
            console.log(session.dialogData);
            let params = {
                memberid: session.message.address.user.id,
                name: session.message.address.user.name,
                channel: session.message.address.channelId,
                facebook_page_access_token: [FB_PAGE_ACCESS_TOKEN],
                // coaches: [{ coach_id: session.dialogData.coach._id }],
                // category: [{ categoryId: session.dialogData.category }],
                recurrence: session.dialogData.recurrence,
                timezome: "",
                conscientiousness: session.dialogData.conscientiousness,
                grit: session.dialogData.grit,
                selfcontrol: session.dialogData.selfcontrol,
                locusofcontrol: session.dialogData.locusofcontrol,
                fearoffailurevsachievement: session.dialogData.ffa,
                construals: session.dialogData.construals
            }
            console.log(params);

            parser.member.updatemember(params, function (err, res, body) {
                if (!err && res.statusCode == 200) {
                    console.log(body);
                    builder.Prompts.text(session, `You’re all set!  I’ll be ready with your first motivation tomorrow…let’s do this!`);
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
]