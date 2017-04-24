

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser');
const CONSTANTS = require('../constants');
const FB_PAGE_ACCESS_TOKEN = CONSTANTS.FB_PAGE_ACCESS_TOKEN;

module.exports = [
    function (session, args, next) {
        session.dialogData.coach = {};
        session.dialogData.coach.name = args.name || "";
        session.dialogData.coach._id = args._id || "";
        session.dialogData.category = args.category || "";
        session.beginDialog('/first-run', session.dialogData);

    },

    function (session, results, next) {
        session.dialogData.category = results.response.category;
        console.log(session.dialogData.category);
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
                arr.forEach(function (element) {
                    if(element == value._id){
                        exist = true;
                        return;
                    }
                }, this);
            
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
            session.beginDialog('/first-run', session.dialogData);
            var options = [
                "7:30am", "11:30am", "4:30pm"
            ]
            builder.Prompts.choice(session, "Alright! What time would you prefer to receive your daily motivation?", options, {
                listStyle: builder.ListStyle.button,
                retryPrompt: `For now let's stick with the given time options.`
            });
        }
    },

    function (session, results, next) {
        session.sendTyping();
        if (results.response) {
            // session.dialogData.recurrence = builder.EntityRecognizer.resolveTime([results.response]);
            session.dialogData.recurrence = results.response.entity;
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
            switch (conscientiousness) {
                case "Completely" | "A lot":
                    conscientiousness = "Hard Worker";
                case "Moderate":
                    conscientiousness = "Inconsistent Effort";
                case "Not at all" | "A little":
                    conscientiousness = "Low Effort";
            }

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
            switch (grit) {
                case "Completely" | "A lot":
                    grit = "Committed";
                case "Moderate":
                    grit = "Semi-Committed";
                case "Not at all" | "A little":
                    grit = "Gives Up Easily";
            }

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
            switch (selfcontrol) {
                case "Completely" | "A lot":
                    selfcontrol = "High Self Control";
                case "Moderate" | "Not at all" | "A little":
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
            switch (locusofcontrol) {
                case "Completely" | "A lot":
                    locusofcontrol = "In Control";
                case "Moderate" | "Not at all" | "A little":
                    locusofcontrol = "Out Of My Control";
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
            switch (ffa) {
                case 4 | 5:
                    ffa = "Glory Seeker";
                case 3:
                    ffa = "Balanced Achiever";
                case 1 | 2:
                    ffa = "Driven by Fear of Failure";
            }

            session.dialogData.ffa = ffa;
            builder.Prompts.text(session, `In 1-2 sentences, write WHY you want to achieve your healthy eating and fitness goals? `)

        }
    },
    function (session, results, next) {
        session.sendTyping();
        if (results.response) {
            session.dialogData.construals = results.response
            let params = {
                memberfbid: session.message.address.user.id,
                name: session.message.address.user.name,
                channel: session.message.address.channelId,
                facebook_page_access_token: FB_PAGE_ACCESS_TOKEN,
                coaches: [{ coach_id: session.dialogData.coach._id }],
                // category: [{ categoryId: session.dialogData.category }],
                recurrence: { timeofday: session.dialogData.recurrence, timezone: "" },
                conscientiousness: session.dialogData.conscientiousness,
                grit: session.dialogData.grit,
                selfcontrol: session.dialogData.selfcontrol,
                locusofcontrol: session.dialogData.locusofcontrol,
                fearoffailurevsachievement: session.dialogData.ffa,
                construals: session.dialogData.construals
            }


            parser.member.updatemember(params, function (err, statusCode) {
                if (!err && statusCode == 200) {
                    var attachments = [];
                    var msgString = `You’re all set!  I’ll be ready with your first motivation tomorrow…let’s do this!`;

                    callback(null, msgString);
                } else {
                    console.log(statusCode);
                    session.send('Something went wrong and your session is not saved. Please try again');
                }
            });
            builder.Prompts.text(session, `You’re all set!  I’ll be ready with your first motivation tomorrow. Let’s do this!`);

        }
    },
    function (session, results) {
        if (results.response) {
            session.replaceDialog('/default');
        }
    }



]