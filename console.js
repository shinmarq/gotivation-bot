var restify = require('restify'),
    builder = require('botbuilder'),
    async = require('async')
    _ = require('underscore'),
    partyBot = require('partybot-http-client'),
    fs = require('fs'),
    util = require('util'),
    path = require('path');

var Menu = require('./dialogs/menu'),
    GuestList = require('./dialogs/guest-list'),
    BookTable = require('./dialogs/book-table'),
    BuyTicket = require('./dialogs/buy-ticket');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3979, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

var model = process.env.model || 
'https://api.projectoxford.ai/luis/v1/application?id=6c4a0d3e-41ff-4800-9ec7-8fd206ee41e8&subscription-key=692f717f9c3b4f52b852d51c46358315&q=';
var recognizer = new builder.LuisRecognizer(model)
var intentDialog = new builder.IntentDialog({ 
    recognizers: [recognizer], 
    intentThreshold: 0.5, 
    recognizeMode: builder.RecognizeMode.onBegin });

var consoleConnector = new builder.ConsoleConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
}).listen();
var bot = new builder.UniversalBot(consoleConnector);

const ORGANISATION_ID =  "5800471acb97300011c68cf7";
const VENUE_ID = "5800889684555e0011585f3c";
const CL = console.log;


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

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'See you at The Palace!', { matches: /^goodbye/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', intentDialog);

bot.dialog('/menu', Menu).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

function venueCards() {
    
}

function eventCards() {

} 

bot.dialog('/guest-list', GuestList);

bot.dialog('/ensure-party', [
    function (session, args, next) {
        builder.Prompts.text(session, 'Please enter the names you would like to add in the guest list (separated by a comma):');
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.party = results.response.split(',');
            builder.Prompts.confirm(session, `So ${session.dialogData.party}. Is this confirmed?`);
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

bot.dialog('/ensure-promoter-code', [
    function (session, args, next) {
        session.dialogData = args || {};
        if (!session.dialogData.promoterCode) {
            builder.Prompts.text(session, `Please enter your promoter code for ${session.dialogData.event} now:`);
        } else {
            // validate via API
            // if promo code valid
            session.endDialogWithResult(session.dialogData.promoterCode);
            // else
        }
    },
    function (session, results, next) {
        session.dialogData.promoterCode = results.response;
        session.replaceDialog('/ensure-promoter-code', session.dialogData);
    }
    // function (session, results) {
    //     var choice = results.response ? 'yes' : 'no';
    //     if (choice === 'yes') {
    //         session.endDialogWithResult( session.dialogData.party );
    //     } else {
    //         session.replaceDialog('/ensure-promoter-code');
    //     }
    // }

    // function (session, args, next) {
    //     session.dialogData = args || {};
    //     if (!session.userData[`${session.dialogData.venue}`].promoCode) {
    //         builder.Prompts.text(session, `Please enter your promoter code for ${session.dialogData.venue} now:`);
    //     } else {
    //         // validate via API
    //         // if promo code valid
    //         session.endDialogWithResult('valid');
    //         // else
    //     }
    // },
    // function (session, results, next) {
    //     session.userData[`${session.dialogData.venue}`].promoCode = results.response;
    //     session.replaceDialog('/ensure-promoter-code', session.dialogData);
    // }
]);

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

intentDialog.matches('Greet', [ 
    function (session, args, next) {
        var argsJSONString = JSON.stringify(args);
        // session.send(`Greet intent detected. ${argsJSONString}.`);
        session.send(`Hello.`);
        next();
    }
]);

intentDialog.matches('AskSomething', [ 
    function (session, args, next) {
        var argsJSONString = JSON.stringify(args);
        // session.send(`AskSomething intent detected. ${argsJSONString}`);
        session.send(`Getting ready for tonight's craziness at The Palace! How about you?`);
        next();
    }
]);

intentDialog.matches('Appreciate', [ 
    function (session, args, next) {
        var argsJSONString = JSON.stringify(args);
        session.send(`No problem :)`);
        // session.send(`Appreciate intent detected. ${argsJSONString}`);
        next();
    }
]);

intentDialog.matches('Confirm', [ 
    function (session, args, next) {
        var argsJSONString = JSON.stringify(args);
        session.send(`Cool!`);
        // session.send(`Confirm intent detected. ${argsJSONString}`);
        next();
    }
]);

intentDialog.matches('Negative', [ 
    function (session, args, next) {
        var argsJSONString = JSON.stringify(args);
        session.send(`Alright!`);
        // session.send(`Negative intent detected. ${argsJSONString}`);
        next();
    }
]);

intentDialog.matches('Curse', [ 
    function (session, args, next) {
        var argsJSONString = JSON.stringify(args);
        session.send(`That's not a very nice thing to say :(`);
        // session.send(`Curse intent detected. ${argsJSONString}`);
        next();
    }
]);

intentDialog.matches('Leave', [ 
    function (session, args, next) {
        var argsJSONString = JSON.stringify(args);
        session.send(`See you at The Palace!`);
        // session.send(`Leave intent detected. ${argsJSONString}`);
        next();
    }
]);

intentDialog.onDefault([
    function (session) {
        // Send a greeting and show the menu.
        var card = new builder.HeroCard(session)
        // todo: change to venue.model
            .title("The Palace Bot")
            .text("Official Bot of The Palace Manila")
            .images([
                 builder.CardImage.create(session, "https://pbs.twimg.com/profile_images/522713296315486208/kZFy9pGU.jpeg")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("Welcome to the Official The Palace Messenger Bot!");
        session.beginDialog('/menu');
    }
]);