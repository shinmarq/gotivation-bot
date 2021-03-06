'use strict';

var restify = require('restify'),
    builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    fs = require('fs'),
    util = require('util'),
    request = require('request'),
    path = require('path'),
    dict = require('./profiledictionary');
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

var consoleConnector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(consoleConnector);

var fburl = "https://graph.facebook.com/v2.6/me/thread_settings?access_token=" + CONSTANTS.FB_PAGE_ACCESS_TOKEN;
var Onboarding1 = require('./dialogs/onboarding-1stpart'),
    Onboarding2 = require('./dialogs/onboarding-2ndpart'),
    Onboarding3 = require('./dialogs/onboarding-3rdpart'),
    Default = require('./dialogs/default'),
    Validatecoach = require('./dialogs/validatecoach'),
    MemberSession = require('./dialogs/member-session'),
    Unsubscribe = require('./dialogs/unsubscribe'),
    Timezone = require('./dialogs/setTimezone');



const logUserConversation = (event,type) => {
    if (event.type == "message" && event.text) {
        var params = {};
        params = {
            member_id: event.address.user.id,
            message_body:{
                message: event.text,
                message_type: type,
            }
        };
        parser.messenger.updatemessenger(params,function(err,response){
            console.log(err);
            console.log(response);
        });
        // console.log(event.attachments[0].content);

    }
};

// Middleware for logging
bot.use({
    receive: function (event, next) {
        logUserConversation(event,"inbound");
        next();
    },
    send: function (event, next) {
        logUserConversation(event,"outbound");
        next();
    }
});

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
        // var senderId = session.message.user.id;
        // var timestamp = session.message.sourceEvent.timestamp;
        // var recipient = session.message.sourceEvent.recipient.id;
        // var mid = session.message.address.id;

        // // Analytics - Incoming Msg
        // const incomingMsgBody = {

        //     "recipient": null,
        //     "timestamp": timestamp,
        //     "message"+: {
        //         "object": "page",
        //         "entry": [
        //         {
        //             "id": "660687187342583",
        //             "time": timestamp,
        //             "messaging": [
        //             {
        //                 "sender": {
        //                 "id": senderId
        //                 },
        //                 "recipient": {
        //                 "id": "660687187342583"
        //                 },
        //                 "timestamp": timestamp,
        //                 "message": {
        //                 "mid": mid,
        //                 "seq": 73,
        //                 "text": session.message.text
        //                 }
        //             }
        //             ]
        //         }
        //         ]

        //     }
        // }
        // userProfileAnalytics(senderId);
        // incomingMsgAnalytics(incomingMsgBody);
        var startOver = /^started|get started|start over/i.test(session.message.text);

        if (session.message.text === "GET_STARTED" || startOver) {
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
                        var params = {
                            updatetype: "reset",
                            memberid: session.message.address.user.id,
                            categories: [],
                            construals: "",
                            profiletype: ""
                        }
                        parser.member.updatemember(params, function (err, res, body) {
                            if (err) { console.log('error reset', res.statusCode) }
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
                            // url: `https://graph.facebook.com/v2.6/${session.message.sourceEvent.sender.id}/?fields=first_name,gender,last_name,locale,timezone&access_token=${CONSTANTS.FB_PAGE_ACCESS_TOKEN}`,
                            url: `https://graph.facebook.com/v2.6/1373383332685110/?fields=first_name,gender,last_name,locale,timezone&access_token=EAAXL7443DqQBAAVEyWZCMFPEFG7O2n88VriJ2MLT9ZAnZBosCEHdr3VMMiaCgXlTXdrlZAfwXqdlDEqDZCkouXdLYZBcOZApOcFTpE67keYvM3cIKMMQVcXKK4ZCuPvq38mrmCjshSmI4lfdi8sCUxV8ZB3onULXK86514G0xFqZAtEgZDZD`,
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
                                    session.send(`Hi ${body.first_name} - Welcome to GOtivation! Staying motivated can be tough, so I’m here to help you along your fitness journey. Each day, I’ll send motivation that is scientifically proven to help you stay inspired and driven. I’m excited to be your motivational chatbot buddy! :)`)
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
            session.sendTyping();
            session.send(`Great! You're with Coach ${session.dialogData.coach.name.first}.`);
            session.sendTyping();
            session.sendTyping();
            session.dialogData.coach.image = results.response.image;
            var msg = new builder.Message(session)
                .attachments([{
                    contentType: "image/jpeg",
                    contentUrl: session.dialogData.coach.image
                }]);

            session.send(msg);
            session.send(`"${results.response.quote}"`);
            session.sendTyping();
            session.sendTyping();
            session.sendTyping();
            session.sendTyping();
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
        session.sendTyping();
        session.sendTyping();
        session.beginDialog('/onboarding-1stpart', session.dialogData);
    }


]);

bot.dialog('/', Default);
bot.dialog('/member-session', MemberSession);
bot.dialog('/onboarding-1stpart', Onboarding1)
    .triggerAction({
        matches: [/^Retake_Survey|retake survey|Retake survey/i] //shin try to search about regex on how to detect words from sentence "i want to retake survey" will not fire this
    });
bot.dialog('/onboarding-2ndpart', Onboarding2)
    .triggerAction({
        matches: [/^Change_Time|change time|Change time/i]//shin try to search about regex on how to detect words from sentence "i want to change my time" will not fire this
    });
bot.dialog('/onboarding-3rdpart', Onboarding3);
bot.dialog('/default', Default);
bot.dialog('/validatecoach', Validatecoach);
bot.dialog('/setTimezone', Timezone);
bot.dialog('/unsubscribe', Unsubscribe)
    .triggerAction({
        matches: [/^unsubscribe|unsubscribed|Unsubscribe/i]
    });

// // Bot Analytics - Incoming
// function incomingMsgAnalytics(json){
//     request({
//             url: 'https://botanalytics.co/api/v1/messages/facebook-messenger/',
//             method: 'POST',
//             headers: {
//                 authorization: 'Token ' + CONSTANTS.ANALYTICS_TOKEN
//             },
//             json: json
//         }, function(err, res, body){
//             !err ? console.log(body) : console.log(err);
//         })
// }
// // Bot Analytics - User profile
// function userProfileAnalytics(userid){

//     async.waterfall([getUserProfile, postUserProfile],function(err, results){
//         !err ? console.log(results) : console.log(err);
//     })

//     function getUserProfile(callback){
//         request({
//             url: 'https://graph.facebook.com/v2.6/' + userid + '?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=' + CONSTANTS.FB_PAGE_ACCESS_TOKEN,
//             method: 'GET'
//         },
//         function(err, res){
//             !err ? callback(null, res) : console.log('error occur..');
//         });
//     }

//     function postUserProfile(args, callback){
//         var userObj = JSON.parse(args.body);
//         var json = {
//             first_name: userObj.first_name,
//             last_name: userObj.last_name,
//             profile_pic: userObj.profile_pic,
//             locale: userObj.locale,
//             timezone: userObj.timezone,
//             gender: userObj.gender,
//             user_id: userid 
//         }

//         request({
//             url: 'https://botanalytics.co/api/v1/facebook-messenger/users/',
//             method: 'POST',
//             headers: {
//                 authorization: 'Token ' + CONSTANTS.ANALYTICS_TOKEN
//             },
//             json: json
//         }, function(err, res, body){
//             !err ? callback(null, res) : console.log(err);
//         });
//     }
// }




