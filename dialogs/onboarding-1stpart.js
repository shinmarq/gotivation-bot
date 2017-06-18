

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser');

const CONSTANTS = require('../constants');
const FB_PAGE_ACCESS_TOKEN = CONSTANTS.FB_PAGE_ACCESS_TOKEN;
module.exports = [
    function (session, args, next) {
        // Update member
        var retakesurvey = /^Retake_Survey|retake survey|Retake survey/i.test(session.message.text);
        if (retakesurvey) {
            var params = {
                updatetype: "retake_survey",
                memberid: session.message.address.user.id,
                categories: [],
                construals: "",
                profiletype: ""
            }
            parser.member.updatemember(params, function (err, res, body) {
                if(!err){
                    console.log(res.statusCode);
                    session.dialogData.coach_id = args.coach === undefined ? "" : args.coach._id;
                    session.dialogData.category = args.category === undefined ? "" : args.category;
                    session.dialogData.user = args.user === undefined ? "" : args.user;
                    session.beginDialog('/member-session', session.dialogData);
                }else{console.log('error occur...')}
                
            });
        }else{
            console.log('NOT RESET OR UPDATE', args);
            session.dialogData.coach_id = args.coach === undefined ? "" : args.coach._id;
            session.dialogData.category = args.category === undefined ? "" : args.category;
            session.dialogData.user = args.user === undefined ? "" : args.user;
            session.beginDialog('/member-session', session.dialogData);
        }

        
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
                session.sendTyping();
                if (err) {
                    session.send(err);
                    session.reset();
                }
                else {
                    if (selectString.length != 0) {
                        session.sendTyping();
                        session.send('Pick the fitness category I can help you with.');
                        builder.Prompts.choice(session, msg, selectString, { retryPrompt: `Select from the given categories` });
                    }
                    else {
                        session.send('You already have all categories selected.');
                        session.replaceDialog('/onboarding-2ndpart');
                    }

                }
            }

        );

        function getcategory(organisationId, msg, callback) {
            session.sendTyping();
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
            session.sendTyping();
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
                        if (element.category == value._id) {
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
            if (attachments.length != 0) {
                msg
                    .textFormat(builder.TextFormat.xml)
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(attachments);

            }
            callback(null, msg, selectString);
        }

    },
    function (session, results, next) {
        console.log(results.response);
        session.sendTyping();
        if (results.response) {
            session.dialogData.category = results.response.entity.split(':')[1];
            //changes
            builder.Prompts.confirm(session, `Would you like to select an additional category?`);
        } else {
            session.replaceDialog('/default');
        }
    },
    function (session, results, next) {
        session.sendTyping();
        //var choice = results.response ? true : false;
        if (results.response) {
            session.beginDialog('/onboarding-1stpart', session.dialogData);
        }
        else {
            async.waterfall([
                function (callback) {
                    session.replaceDialog('/member-session', session.dialogData);
                    callback(null, 'success');
                },
                function (arg1, callback) {
                    // arg1 now equals 'three'
                    session.replaceDialog('/onboarding-2ndpart');
                    callback(null, 'done');
                }
            ], function (err, result) {
                // result now equals 'done'
                if (err) {
                    console.error(err);
                    return;
                } else {
                    console.log(result);
                }
            });

        }
    }
]

