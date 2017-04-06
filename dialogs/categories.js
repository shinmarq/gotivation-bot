

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
    function(session, results, next) {
        var choice = results.response ? 'yes' : 'no';
        if (choice === 'yes') {
            session.dialogData.coach = {};
            session.beginDialog('/validatecoach', session.dialogData);
        } else {
            next();
        }
    },
    function(session, results) {
        
         var getParams = {
            memberid: session.message.address.user.id,
            tags: 'table'
        };
        async.waterfall([
            async.apply(getCategories, getParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                if(err) {
                    session.send(err);
                    session.reset();
                } else {
                    session.send('Pick the fitness category I can help you with.');
                    builder.Prompts.choice(session, msg, selectString);
                }
                
            });
        function getCategories(getParams, msg, callback) {
            parser.category.getCategory(, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    if(body.length > 0) {
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
            body.map(function(value, index) {
                selectString.push('select:'+value._id);
                attachments.push(
                    new builder.HeroCard(session)
                    .title(value.name)
                    .text(value.description)
                    .images([
                        builder.CardImage.create(session, value.image )
                        .tap(builder.CardAction.showImage(session,value.image)),
                        ])
                    .buttons([
                        builder.CardAction.imBack(session, "select:"+value._id, value.name)
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
        
    }
]