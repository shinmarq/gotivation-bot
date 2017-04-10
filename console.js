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


var Onboarding = require('./dialogs/onboarding');
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server

var fburl = "https://graph.facebook.com/v2.6/me/thread_settings?access_token=" + CONSTANTS.FB_PAGE_ACCESS_TOKEN;

var consoleConnector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(consoleConnector);
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));
bot.dialog('/', function (session) {
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
                            .subtitle(`Hi ${session.message.address.user.name}!,Welcome to GOtivation! Together, we’re going to motivate, educate, and encourage you along our fitness journey. Each day, I’ll send you motivation that is scientifically proven to help you succeed. I think you’re going to be excited about the transformation :)`)
                            .images([
                                new builder.CardImage(session)
                                    .url(`${CONSTANTS.BASE_URL}/assets/GOtivation+Logo.jpg`)
                                    .alt('Logo')
                            ]);

                        session.send(new builder.Message(session)
                            .addAttachment(welcomeCard));

                        
                    session.beginDialog('/onboarding');
                    } 
                });

        } else {
                    session.beginDialog('/onboarding');
 
        }
});

bot.dialog('/onboarding', Onboarding);

