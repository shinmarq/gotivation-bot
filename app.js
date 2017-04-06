'use strict';

var restify = require('restify');
var builder = require('botbuilder');

var async = require('async');
var _ = require('underscore');
var partyBot = require('partybot-http-client');
var request = require('request');
const util = require('util');
const CONSTANTS = require('./constants');
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.get(/\/assets\/?.*/, restify.serveStatic({
    directory: __dirname
}));
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
console.log(connector);
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


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
                            .subtitle(`Hi ${session.message.address.user.name}!,Welcome to GOtivation! Together, we’re going to motivate, educate, and encourage you along our fitness journey. Each day, I’ll send you motivation that is scientifically proven to help you succeed. I think you’re going to be excited about the transformation :)`)
                            .images([
                                new builder.CardImage(session)
                                    .url(`${CONSTANTS.BASE_URL}/assets/GOtivation+Logo.jpg`)
                                    .alt('Logo')
                            ]);

                        session.send(new builder.Message(session)
                            .addAttachment(welcomeCard));
                        next();
                    } else {
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

                        next();
                    }
                });

        } else {
            next();
        }
    }
});


bot.dialog('/default', [
    function (session, args, next) {
        var entity = args || session.message.text;
        console.log(entity);
        if (entity && entity.length > 0) {
           if((/^menu|show menu/i.test(entity))) {
                 session.beginDialog('/menu');
             }  
            else {
                var params = {
                    entity: entity
                };
                partyBot.queries.getQueryForBot(params, function (err, response, body) {
                    if (err) {
                        session.send(
                            'Sorry, I didn’t quite understand that yet since I’m still a learning bot. Let me store that for future reference.\n' +
                            'In the mean time, type “Menu” if you want to find out the cool things I can do for you!');
                        // session.replaceDialog('/menu');
                        var createParams = {
                            entity: entity,
                            _venue_id: null 
                            
                        };
                        partyBot.queries.createQuery(createParams, function (err, response, body) {

                        });
                    } else {
                        session.send(body.reply);
                    }
                });

            }
        }
    }
    //
]);
