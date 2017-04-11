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

var consoleConnector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(consoleConnector);

var fburl = "https://graph.facebook.com/v2.6/me/thread_settings?access_token=" + CONSTANTS.FB_PAGE_ACCESS_TOKEN;
var Onboarding = require('./dialogs/onboarding');
var Default = require('./dialogs/default');


bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

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
                    if (!error && response.statusCode == 200) {
                        session.userData.firstRun = true;
                        var welcomeCard = new builder.HeroCard(session)
                            .title('Gotivation bot')
                            .images([
                                new builder.CardImage(session)
                                    .url(`${CONSTANTS.IMG_PATH}GOtivation+Logo.png`)
                                    .alt('Logo')
                            ]);

                        session.send(new builder.Message(session)
                            .addAttachment(welcomeCard));

                        session.sendTyping();
                        session.send(`Hi ${session.message.address.user.name}!,Welcome to GOtivation! Together, we’re going to motivate, educate, and encourage you along our fitness journey. Each day, I’ll send you motivation that is scientifically proven to help you succeed. I think you’re going to be excited about the transformation :)`)
                        session.replaceDialog('/get-coachcode');
                    }
                });

        }
        // else {
        //             session.send(`Hi ${session.message.address.user.name}! Welcome back!`)
        //             session.sendTyping();
        //             session.beginDialog('/onboarding');
        //             next();

        // }
    },
    
});
bot.dialog('/get-coachcode', [
    function(session, response,next) {
        session.sendTyping();
        builder.Prompts.confirm(session, `Before we proceed, do you have a coach code?`);
        console.log(session);
    },
    function (session, results) {
        console.log(session);
        var choice = results.response ? 'yes' : 'no';
        if (choice === 'yes') {

             // session.dialogData.coach = {};
            // session.beginDialog('/validatecoach', session.dialogData);

            session.dialogData.coach.name = `Ivy`;
            session.dialogData.prefix = `Great! You're with Coach ${session.dialogData.coach.name} .`;
        } else {
            session.dialogData.prefix = `That's okay.`;
        }
        session.beginDialog('/onboarding',session.dialogData);
    }
]);

bot.dialog('/onboarding', Onboarding);
bot.dialog('/default', Default);

