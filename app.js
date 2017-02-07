'use strict';

var restify = require('restify');
var builder = require('botbuilder');

var async = require('async');
var _ = require('underscore');
var partyBot = require('partybot-http-client');
var request = require('request');
var ORGANISATION_ID =  "5800471acb97300011c68cf7";
var FBPAGE_ACCESS_TOKEN = "EAANW2ZALpyZAABALnAf7FTmhOgrciIkZBBvLjH8o8gpC5m1NzBWW5xbDstkCOq8TR8ZBNsJfwHjeaUsxZBaYESyxGew1BrzkippXM8vIFHeDbvraHw59Xj4QNrrZBpreBkE7cJ1SGTIPjcBXq4e3CedZBHU6wJV3ZCfARxAZAeR438gZDZD";

const util = require('util');
const CONSTANTS = require('./constants');
var Menu = require('./dialogs/menu'),
    GuestList = require('./dialogs/guest-list'),
    BuyTicket = require('./dialogs/buy-ticket'),
    BookTable = require('./dialogs/book-table'),
    FirstRun = require('./dialogs/first-run'),
    EnsurePromoterCode = require('./dialogs/ensure-promoter-code');
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
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


//=========================================================
// AI Setup
//=========================================================

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = process.env.model || 
'https://api.projectoxford.ai/luis/v1/application?id=6c4a0d3e-41ff-4800-9ec7-8fd206ee41e8&subscription-key=692f717f9c3b4f52b852d51c46358315&q=';
var recognizer = new builder.LuisRecognizer(model)
var intentDialog = new builder.IntentDialog({ 
    recognizers: [recognizer], 
    intentThreshold: 0.5, 
    recognizeMode: builder.RecognizeMode.onBegin });

//=========================================================
// Activity Events
//=========================================================
bot.on('conversationUpdate', function (message) {
   // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                            .address(message.address)
                            .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Welcome to the Official The Palace Messenger Bot! What can I do for you?", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});

//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));
// bot.use(builder.Middleware.firstRun({ version: 1.0, dialogId: '/firstRun' }));

//=========================================================
// Bots Global Actions
//=========================================================

// bot.endConversationAction('goodbye', 'See you at The Palace!', { matches: /^goodbye/i });

//=========================================================
// Bots Dialogs
//=========================================================
bot.use({
    botbuilder: function (session, next) {
        if (session.message.text === "GET_STARTED") {
            session.perUserInConversationData = {};
            session.userData = {};
            session.conversationData = {};
        }

        if (!session.userData.firstRun) {
            var params = {
                setting_type:"call_to_actions",
                thread_state:"new_thread",
                call_to_actions:[{
                    payload:"GET_STARTED"
                }]
            };

            request({
                url: 'https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAANW2ZALpyZAABANrZAuKgOkZC69lsLkziaA6wsNEMOZAqRgBzguyGvJEkCa7mfA7nw6ewlJq5cHdUytcBqz5YwhcZCDmPPdI12hTh48yjhwOULtIm9yokJ8bm7BUbmZAPALIwXlev1g6mcmWveWZCCjO7bXgFOA5hqtOvjZBPWtSZCwZDZD',
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                form: params
            },

            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    session.userData.firstRun = true;
                    var msg = new builder.Message(session)
                    .addAttachment({
                        contentUrl: 'https://docs.botframework.com/en-us/images/faq-overview/botframework_overview_july.png',
                        contentType: 'image/jpeg',
                        name: 'BotFrameworkOverview.png'
                    });

                    session.send(msg);
                    session.send(`Hi ${session.message.address.user.name} Welcome to the official The Palace Messenger Bot! I’m here to make your partying easier! Click the button below to start!`);
                    session.beginDialog('/firstRun');
                    next();
                } else { 
                    session.userData.firstRun = true;
                    var msg = new builder.Message(session)
                    .addAttachment({
                        contentUrl: 'https://docs.botframework.com/en-us/images/faq-overview/botframework_overview_july.png',
                        contentType: 'image/jpeg',
                        name: 'BotFrameworkOverview.png'
                    });

                    session.send(msg);
                    session.send(`Hi ${session.message.address.user.name} Welcome to the official The Palace Messenger Bot! I’m here to make your partying easier! Click the button below to start!`);
                    session.beginDialog('/firstRun');
                    next();
                }
            });
            
        } else {
            next();
        }
    }
});
bot.dialog('/firstRun', FirstRun);
bot.dialog('/', intentDialog);
bot.dialog('/menu', Menu).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

bot.dialog('/guest-list', GuestList); // End guest-list

bot.dialog('/ensure-party', [
    function (session, args, next) {
        builder.Prompts.text(session, 'Please enter the names you would like to add in the guest list (one name per line or comma separated):');
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.party = results.response.split(/[,\n]+/) || [];
            builder.Prompts.confirm(session, `${session.dialogData.party.join('\n')}\n\nIs this confirmed?`);
        } 
    },
    function (session, results) {
        var choice = results.response ? 'yes' : 'no';
        if (choice === 'yes') {
            session.endDialogWithResult( session.dialogData.party );
        } else {
            session.replaceDialog('/ensure-party');
        }
    }
]);

bot.dialog('/ensure-promoter-code', EnsurePromoterCode.Dialog);

bot.dialog('/book-table', BookTable);

bot.dialog('/ensure-table', [
    function (session, args, next) {
        // todo : verify table availability ("add to cart")
        var verified = true;
        if (verified) {
            
        }
    },
    function (session, results, next) {

    }
]);

bot.dialog('/buy-tickets', BuyTicket);

//=========================================================
// Natural Language Processing
//=========================================================

//=========================================================
// Natural Language Processing
//=========================================================

// intentDialog.matches('Greet', [ 
//     function (session, args, next) {
//         var argsJSONString = JSON.stringify(args);
//         // session.send(`Greet intent detected. ${argsJSONString}.`);
//         session.send(`Hello.`);
//         next();
//     }
// ]);

// intentDialog.matches('AskSomething', [ 
//     function (session, args, next) {
//         var argsJSONString = JSON.stringify(args);
//         // session.send(`AskSomething intent detected. ${argsJSONString}`);
//         session.send(`Getting ready for tonight's craziness at The Palace! How about you?`);
//         next();
//     }
// ]);

// intentDialog.matches('Appreciate', [ 
//     function (session, args, next) {
//         var argsJSONString = JSON.stringify(args);
//         session.send(`No problem :)`);
//         // session.send(`Appreciate intent detected. ${argsJSONString}`);
//         next();
//     }
// ]);

// intentDialog.matches('Confirm', [ 
//     function (session, args, next) {
//         var argsJSONString = JSON.stringify(args);
//         session.send(`Cool!`);
//         // session.send(`Confirm intent detected. ${argsJSONString}`);
//         next();
//     }
// ]);

// intentDialog.matches('Negative', [ 
//     function (session, args, next) {
//         var argsJSONString = JSON.stringify(args);
//         session.send(`Alright!`);
//         // session.send(`Negative intent detected. ${argsJSONString}`);
//         next();
//     }
// ]);

// intentDialog.matches('Curse', [ 
//     function (session, args, next) {
//         var argsJSONString = JSON.stringify(args);
//         session.send(`That's not a very nice thing to say :(`);
//         // session.send(`Curse intent detected. ${argsJSONString}`);
//         next();
//     }
// ]);

// intentDialog.matches('Leave', [ 
//     function (session, args, next) {
//         var argsJSONString = JSON.stringify(args);
//         session.send(`See you at The Palace!`);
//         // session.send(`Leave intent detected. ${argsJSONString}`);
//         next();
//     }
// ]);

intentDialog.onDefault([
    function(session, next) {
        session.replaceDialog('/default', session.message.text);
    }
    // function (session, args, next) {
    //     // Send a greeting and show the menu.
    //     var card = new builder.HeroCard(session)
    //     // todo: change to venue.model
    //         .title("The Palace Bot")
    //         .text("Official Bot of The Palace Manila")
    //         .images([
    //              builder.CardImage.create(session, "https://pbs.twimg.com/profile_images/522713296315486208/kZFy9pGU.jpeg")
    //         ]);
    //     var msg = new builder.Message(session).attachments([card]);
    //     session.send(msg);
    //     session.send("Welcome to the Official The Palace Messenger Bot!");
    //     session.beginDialog('/menu');
    // }
//
]);

bot.dialog('/default', [
    function(session, args, next) {
        var entity = args || session.message.text;
        console.log(entity);
        if (entity === "GET_STARTED") {
            // session.send(`Hi ${session.message.address.user.name} Welcome to the official The Palace Messenger Bot! I’m here to make your partying easier! If you want to find out all the things I can do for you, type “Menu”`);
        }
        else if(entity && entity.length > 0) {
            if(!(/^menu|show menu/i.test(entity))) {
                var params = {
                    organisationId: ORGANISATION_ID,
                    entity: entity
                };
                partyBot.queries.getQueryForBot(params, function(err, response, body) {
                    if(err) {
                        session.send(
                            'Sorry, I didn’t quite understand that yet since I’m still a learning bot. Let me store that for future reference.\n'+
                            'In the mean time, type “Menu” if you want to find out the cool things I can do for you!');
                        // session.replaceDialog('/menu');
                        var createParams = {
                            organisationId: ORGANISATION_ID,
                            entity: entity,
                            _venue_id: null
                        };
                        partyBot.queries.createQuery(createParams, function(err, response, body) {

                        });
                    } else {
                        session.send(body.reply);
                    }
                });

            }  else {
                session.beginDialog('/menu');
            }
        }
    }
//
]);
