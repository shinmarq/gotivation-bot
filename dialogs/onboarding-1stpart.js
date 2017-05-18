

var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    parser = require('../parser');

const CONSTANTS = require('../constants');
const FB_PAGE_ACCESS_TOKEN = CONSTANTS.FB_PAGE_ACCESS_TOKEN;
module.exports = [
    function (session, args, next) {
        session.dialogData.coach_id = args.coach === undefined ? "" : args.coach._id;
        session.dialogData.category = args.category || "";
        session.dialogData.user = args.user === undefined ? "" : args.user;
        session.beginDialog('/member-session', session.dialogData);

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
                    if (selectString.length != 0) {
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
            console.log(attachments, selectString);
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
        if (results.response) {
            session.dialogData.category = results.response.entity.split(':')[1];

            builder.Prompts.confirm(session, `Would you like to select another category?`);
        } else {
            session.replaceDialog('/default');
        }
    },
    function (session, results, next) {
        //var choice = results.response ? true : false;
        if (results.response) {
            session.beginDialog('/onboarding-1stpart', session.dialogData);
        }
        else {

            async.waterfall([ async.apply( _function1, _function2)], 
            function (err, result) {
                if(err){ 
                    console.error(err); 
                    return;
                }
                console.log(result);
            });

            function _function1(callback) {
                session.replaceDialog('/member-session', session.dialogData);
                callback(null, 'func1');
            }

            function _function2(arg, callback) {
                session.replaceDialog('/onboarding-2ndpart');  
                callback(null, 'func2');
            }
        }
    }
]