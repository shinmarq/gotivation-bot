'use strict';

var restify = require('restify'),
    builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    fs = require('fs'),
    util = require('util'),
    request = require('request'),
    path = require('path');

const CONSTANTS = require('./constants');
var parser = require('./parser');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 5000, function () {
    console.log('%s listening to %s', server.name, server.url);
});

//console.log("MICROSOFT APP ID: ", process.env.MICROSOFT_APP_ID);
//console.log("MICROSOFt APP PASSWORD: ", process.env.MICROSOFT_APP_PASSWORD); 
// Create chat bot""
var connector = new builder.ChatConnector({
    appId: '0033295f-64bc-4f3a-8a84-94ec5226a24e',
    appPassword: 'hG5g9Yng7MXScphOnATNPQO'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var fburl = "https://graph.facebook.com/v2.6/me/thread_settings?access_token=" + CONSTANTS.FB_PAGE_ACCESS_TOKEN;

var Onboarding = require('./dialogs/onboarding');
var Default = require('./dialogs/default');
var Validatecoach = require('./dialogs/validatecoach');


bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));
var model = process.env.model ||
    'https://api.projectoxford.ai/luis/v1/application?id=ff6021a2-8bc4-4557-bb0e-3394bc2ae164&subscription-key=692f717f9c3b4f52b852d51c46358315&q=';
var recognizer = new builder.LuisRecognizer(model)
var intentDialog = new builder.IntentDialog({
    recognizers: [recognizer],
    intentThreshold: 0.5,
    recognizeMode: builder.RecognizeMode.onBegin
});


bot.use({
    botbuilder: function (session, next) {
        if (session.message.text === "GET_STARTED") {
            session.perUserInConversationData = {};
            session.userData = {};
            session.conversationData = {};
        }

        if (!session.userData.firstRun) {
            var params = {
                setting_type: "call_to_actions",
                thread_state: "new_thread",
                call_to_actions: [{
                    payload: "GET_STARTED"
                }]
            };
            request({
                url: fburl,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                form: params
            },
                function (error, response, body) {
                    console.log(error);
                    console.log(response.statusCode);
                    if (!error && response.statusCode == 200) {
                        session.userData.firstRun = true;
                        var welcomeCard = new builder.HeroCard(session)
                            .title('GOtivation bot')
                            .images([
                                new builder.CardImage(session)
                                    .url(`http://res.cloudinary.com/hobwovvya/image/upload/v1491976005/Gotivationlogo_small_wzdjok.png`)
                                    .alt('Logo')
                            ]);

                        session.send(new builder.Message(session)
                            .addAttachment(welcomeCard));
                        var firstname;
                        request({
                            url: `https://graph.facebook.com/v2.6/${session.message.sourceEvent.sender.id}/?fields=first_name`,
                            qs: { access_token: FB_PAGE_ACCESS_TOKEN },
                            method: 'GET'
                        }), {
                                function(error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        firstname = body.first_name
                                    }
                                    else {
                                        // TODO: Handle errors
                                       session.send(error);
                                       session.send("Get user profile failed");
                                    }
                                }
                            }

                        session.sendTyping();
                        session.send(`Hi ${firstname}! Welcome to GOtivation! Together, we’re going to motivate, educate, and encourage you along our fitness journey. Each day, I’ll send you motivation that is scientifically proven to help you succeed. I think you’re going to be excited about the transformation :)`)
                        session.beginDialog('/get-coachcode');
                    }
                });

        } else {
            next();

        }
    }
});

bot.dialog('/get-coachcode', [
    function (session, args, next) {
        session.sendTyping();
        builder.Prompts.confirm(session, `Before we proceed, do you have a coach code?`);

    },
    function (session, results, next) {
        session.sendTyping();
        var choice = results.response ? 'yes' : 'no';
        if (choice === 'yes') {
            session.dialogData.coach = {};
            session.beginDialog('/validatecoach', session.dialogData);

        } else {
            session.dialogData.prefix = `That's okay.`;
            next();
        }
    },
    function (session, results) {

        if (results.response && results.response.validCode == true) {
            session.dialogData.coach.name = results.response.name;
            session.dialogData.coach._id = results.response._id;
            session.dialogData.prefix = `Great! You're with Coach ${session.dialogData.coach.name} .`;
        }
        session.beginDialog('/onboarding', session.dialogData);
    }



]);

bot.dialog('/', intentDialog);
bot.dialog('/onboarding', Onboarding);
bot.dialog('/default', Default);
bot.dialog('/validatecoach', Validatecoach);