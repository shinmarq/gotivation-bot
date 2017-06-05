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
server.listen(process.env.port || process.env.PORT || 3000, function () {
    console.log('%s listening to %s', server.name, server.url);
});

//console.log("MICROSOFT APP ID: ", process.env.MICROSOFT_APP_ID);
//console.log("MICROSOFt APP PASSWORD: ", process.env.MICROSOFT_APP_PASSWORD); 
// Create chat bot""
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


var fburl = "https://graph.facebook.com/v2.6/me/thread_settings?access_token=" + CONSTANTS.FB_PAGE_ACCESS_TOKEN;
var Onboarding1 = require('./dialogs/onboarding-1stpart'),
    Onboarding2 = require('./dialogs/onboarding-2ndpart'),
    Onboarding3 = require('./dialogs/onboarding-3rdpart'),
    Default = require('./dialogs/default'),
    Validatecoach = require('./dialogs/validatecoach'),
    MemberSession = require('./dialogs/member-session');


bot.use(builder.Middleware.dialogVersion({ version: 1.2, resetCommand: /^reset/i }));
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
        var startOver = /^started|get started|start over/i.test(session.message.text);
        //var changeTime = /^Change_Time/i.test(session.message.text);
        //var retakeSurvey = /^Retake_Survey/i.test(session.message.text);


        if (session.message.text === "GET_STARTED" || startOver) {
            session.perUserInConversationData = {};
            session.userData = {};
            session.conversationData = {};
        }

        //changeTime ? session.replaceDialog('/onboarding-2ndpart') : console.log('skip change time...');
        //retakeSurvey ? session.replaceDialog('/onboarding-1stpart') : console.log('skip change survey...');
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
                        var params = {
                            updatetype: "reset",
                            memberid: session.message.address.user.id,
                            categories: [],
                            classes: [],
                            construals: "",
                            profiletype: ""
                        }
                        parser.member.updatemember(params, function (err, res, body) {
                            console.log(res.statusCode);
                        });
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

                        request({
                            url: `https://graph.facebook.com/v2.6/${session.message.sourceEvent.sender.id}/?fields=first_name,gender,last_name,locale,timezone&access_token=${CONSTANTS.FB_PAGE_ACCESS_TOKEN}`,
                            //url: `https://graph.facebook.com/v2.6/1373383332685110/?fields=first_name,gender,last_name,locale,timezone&access_token=EAAXL7443DqQBAAVEyWZCMFPEFG7O2n88VriJ2MLT9ZAnZBosCEHdr3VMMiaCgXlTXdrlZAfwXqdlDEqDZCkouXdLYZBcOZApOcFTpE67keYvM3cIKMMQVcXKK4ZCuPvq38mrmCjshSmI4lfdi8sCUxV8ZB3onULXK86514G0xFqZAtEgZDZD`,
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' }
                        },
                            function (error, response, body) {

                                body = JSON.parse(body);
                                if (!error && response.statusCode == 200) {
                                    session.userData.user = {};
                                    session.userData.user.first_name = body.first_name;
                                    session.userData.user.gender = body.gender;
                                    session.userData.user.last_name = body.last_name;
                                    session.userData.user.locale = body.locale;
                                    session.userData.user.timezone = body.timezone;
                                    session.send(`Hi ${body.first_name} - Welcome to GOtivation! Together, we’re going to motivate, educate, and encourage you along our fitness journey. Each day, I’ll send you motivation that is scientifically proven to help you succeed. I think you’re going to be excited about the transformation :)`)
                                    session.beginDialog('/get-coachcode', session.userData);
                                    //session.beginDialog('/default');
                                }
                                else {
                                    // TODO: Handle errors
                                    session.send(error);
                                    session.send("Get user profile failed");
                                }
                            });
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
        session.sendTyping();
        if (results.response && results.response.validCode == true) {

            session.dialogData.coach.name = results.response.name;
            session.dialogData.coach._id = results.response._id;
            session.dialogData.prefix = `Great! You're with Coach ${session.dialogData.coach.name.first}.`;
            session.dialogData.coach.image = results.response.image;
            var msg = new builder.Message(session)
                .text(`${session.dialogData.prefix}`)
                .attachments([{
                    contentType: "image/jpeg",
                    contentUrl: session.dialogData.coach.image
                }]);

            session.sendTyping();
            session.sendTyping();
            session.send(msg);

        }
        else {
            session.sendTyping();
            session.sendTyping();
            session.send(session.dialogData.prefix);
        }
        session.dialogData.user = session.userData.user;
        
        session.sendTyping();
        session.sendTyping();
        session.sendTyping();
        session.send(`Let’s get started then! Please answer the following questions so we can find motivation that works specifically for YOU.  (This survey will take about 2 minutes.)`);
        session.sendTyping();
        session.beginDialog('/onboarding-1stpart', session.dialogData);
    }



]);

bot.dialog('/', Default);
bot.dialog('/member-session', MemberSession);
bot.dialog('/onboarding-1stpart', Onboarding1)
    .triggerAction({
        matches: [/^Retake_Survey/i],
        onSelectAction: function(session, args){
            var params = {
                            updatetype: "reset",
                            memberid: session.message.address.user.id,
                            categories: [],
                            classes: [],
                            construals: "",
                            profiletype: ""
                        }
            parser.member.updatemember(params, function (err, res, body) {
                console.log(res.statusCode);
            });
            //session.beginDialog(args.action, args);
        }
    })
    .beginDialogAction('Retake_Survey', 'onboarding-1stpart', { matches: /^Retake_Survey$/ });
bot.dialog('/onboarding-2ndpart', Onboarding2)
    .triggerAction({
        matches: [/^Change_Time/i]
    });
bot.dialog('/onboarding-3rdpart', Onboarding3);
bot.dialog('/default', Default);
bot.dialog('/validatecoach', Validatecoach);




