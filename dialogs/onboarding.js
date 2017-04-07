

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser');
const Constants = require('../constants');
const FB_PAGE_ACCESS_TOKEN = Constants.FB_PAGE_ACCESS_TOKEN;

module.exports = [
    function (session) {
        var msg = new builder.Message(session);
        builder.Prompts.confirm(session, 'Do you have a coach code?');
    },
    function (session, results, next) {
        var choice = results.response ? 'yes' : 'no';
        if (choice === 'yes') {
            session.dialogData.coach = {};
            session.beginDialog('/validatecoach', session.dialogData);
        } else {
            next();
        }
    },
    function (session, results, next) {
        var prefix;
        if (session.dialogData.coach._id) {
            prefix = "Great! You're with Coach " + session.dialogData.coach.name;
        }
        else {
            prefix = "I'ts ok, you'll have your coach soon. "
        }
        var getParams = {
            memberid: session.message.address.user.id,
            tags: 'table'
        };
        async.waterfall([
            async.apply(getCategories, getParams, msg),
            formatBody,
            sendMessage
        ],
            function (err, msg, selectString) {
                if (err) {
                    session.send(err);
                    session.reset();
                } else {
                    session.send(`${prefix} . Pick the fitness category I can help you with.`);
                    builder.Prompts.choice(session, msg, selectString, { maxRetries: 0 });
                }
            });
        function getCategories(getParams, msg, callback) {
            parser.category.getCategory(, function (err, res, body) {
                if (!err && res.statusCode == 200) {
                    if (body.length > 0) {
                        callback(null, body, msg);
                    } else {
                        callback("No categories available for you yet", [], null);
                    }
                } else {
                    callback(body, res.statusCode, []);
                }
            });
        }

        function formatBody(body, msg, callback) {
            var attachments = [];
            var selectString = [];
            body.map(function (value, index) {
                selectString.push('select:' + value._id);
                attachments.push(
                    new builder.HeroCard(session)
                        .title(value.name)
                        .text(value.description)
                        .images([
                            builder.CardImage.create(session, value.image)
                                .tap(builder.CardAction.showImage(session, value.image)),
                        ])
                        .buttons([
                            builder.CardAction.imBack(session, "select:" + value._id, value.name)
                        ])
                );
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
            session.dialogData.name = results.response;
            builder.Prompts.time(session, "Great! What time would you prefer to receive your daily motivation?");
        } else {
            session.beginDialog('/default');
        }
    },

    function (session, results, next) {
        if (results.response) {
            session.dialogData.time = builder.EntityRecognizer.resolveTime([results.response]);
            if (session.dialogData.time) {
                builder.Prompts.text(session, "Got it! Please indicate how much the following statements describe you.", options, { maxRetries: 0 });
                var options = ["Completely", "A lot", "Moderate", "Not at all", "A little"]
                builder.Prompts.choice(session, "When I say I'm going to work out at a specific time, I always follow through.", options);

            }
            else {
                session.beginDialog('/default');
            }
        }

    },

    function (session, results, next) {
        if (results.response) {
            var conscientiousness = builder.EntityRecognizer.text(results.response);
            switch (conscientiousness) {
                case "Completely" | "A lot":
                    conscientiousness = "Hard Worker";
                case "Moderate":
                    conscientiousness = "Inconsistent Effort";
                case "Not at all" | "A little":
                    conscientiousness = "Low Effort";
            }

            session.dialogData.conscientiousness = conscientiousness;
            var options = [
                { name: "Completely", id: "Committed" },
                { name: "A lot", id: "Committed" },
                { name: "Moderate", id: "Semi-Committed" },
                { name: "Not at all", id: "Gives Up Easily" },
                { name: "A little", id: "Gives Up Easily" }]
            builder.Prompts.choice(session,
                "I have achieved health goals that took a long time to accomplish.",
                options, {
                    listStyle: builder.ListStyle.button
                });

        }
        else {
            session.beginDialog('/default');
        }
    },
    function (session, results, next) {
        if (results.response) {
            var grit = builder.EntityRecognizer.text(results.response);
            // switch (grit) {
            //     case "Completely" | "A lot":
            //         grit = "Committed";
            //     case "Moderate":
            //         grit = "Semi-Committed";
            //     case "Not at all" | "A little":
            //         grit = "Gives Up Easily";
            // }

            session.dialogData.grit = grit;
            var options = ["Completely", "A lot", "Moderate", "Not at all", "A little"]
            builder.Prompts.choice(session,
                "I am able to give up temporary pleasures such as sweets in order to pursue my fitness/health goals.",
                options, {
                    listStyle: builder.ListStyle.button
                });

        }
        else {
            session.beginDialog('/default');
        }
    },

    function (session, results, next) {
        if (results.response) {
            var selfcontrol = builder.EntityRecognizer.text(results.response);
            switch (selfcontrol) {
                case "Completely" | "A lot":
                    selfcontrol = "High Self Control";
                case "Moderate" | "Not at all" | "A little":
                    selfcontrol = "Low Self Control";
            }

            session.dialogData.selfcontrol = selfcontrol;
            var options = ["Completely", "A lot", "Moderate", "Not at all", "A little"]
            builder.Prompts.choice(session,
                "I have control over my own health.",
                options, {
                    listStyle: builder.ListStyle.button
                });
        }
        else {
            session.beginDialog('/default');
        }
    },
    function (session, results, next) {
        if (results.response) {
            var locusofcontrol = builder.EntityRecognizer.text(results.response);
            switch (locusofcontrol) {
                case "Completely" | "A lot":
                    locusofcontrol = "In Control";
                case "Moderate" | "Not at all" | "A little":
                    locusofcontrol = "Out Of My Control";
            }

            session.dialogData.locusofcontrol = locusofcontrol;
            var options =
                [
                    { label: "Greatly anticipate feelings of achievement when meeting your goal", value: 5 },
                    { label: "Somewhat anticipate feelings of achievement when meeting your goal", value: 4 },
                    { label: "Neutral", value: 3 },
                    { label: "Somewhat fear failing to meet your goal", value: 2 },
                    { label: "Greatly fear failing to meet your goal", value: 1 },
                ]
            builder.Prompts.choice(session,
                "Please select the point on the scale that best describes you.",
                options, {
                    listStyle: builder.ListStyle.button
                });

        }
        else {
            session.beginDialog('/default');
        }
    },
    function (session, results, next) {
        if (results.response) {
            var ffa = builder.EntityRecognizer.text(results.response);
            switch (ffa) {
                case 4 | 5:
                    ffa = "Glory Seeker";
                case 3:
                    ffa = "Balanced Achiever";
                case 1 | 2:
                    ffa = "Driven by Fear of Failure";
            }

            session.dialogData.ffa = ffa;
            builder.Prompts.text(session, `In 1-2 sentences, write WHY you want to achieve your healthy eating and fitness goals with ${session.dialogData.coach.name}? `)

        }
        else {
            session.beginDialog('/default');
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.construals = results.response.entity
            createmember()



        }

    }



]