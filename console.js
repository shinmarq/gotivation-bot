var restify = require('restify'),
    builder = require('botbuilder'),
    async = require('async')
    _ = require('underscore'),
    fs = require('fs'),
    util = require('util'),
    request = require('request'),
    path = require('path');
const CONSTANTS = require('./constants');
var Menu = require('./dialogs/menu'),
    DefaultDiag = require('./dialogs/default'),

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3979, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// var model = process.env.model || 
// 'https://api.projectoxford.ai/luis/v1/application?id=6c4a0d3e-41ff-4800-9ec7-8fd206ee41e8&subscription-key=692f717f9c3b4f52b852d51c46358315&q=';
// var recognizer = new builder.LuisRecognizer(model)
var intentDialog = new builder.IntentDialog({ 
    // recognizers: [recognizer], 
    intentThreshold: 0.5, 
    recognizeMode: builder.RecognizeMode.onBegin });

var consoleConnector = new builder.ConsoleConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
}).listen();
var bot = new builder.UniversalBot(consoleConnector);



// bot.on('conversationUpdate', function (message) {
//    // Check for group conversations
//     if (message.address.conversation.isGroup) {
//         // Send a hello message when bot is added
//         if (message.membersAdded) {
//             message.membersAdded.forEach(function (identity) {
//                 if (identity.id === message.address.bot.id) {
//                     var reply = new builder.Message()
//                             .address(message.address)
//                             .text("Hello everyone!");
//                     bot.send(reply);
//                 }
//             });
//         }

//         // Send a goodbye message when bot is removed
//         if (message.membersRemoved) {
//             message.membersRemoved.forEach(function (identity) {
//                 if (identity.id === message.address.bot.id) {
//                     var reply = new builder.Message()
//                         .address(message.address)
//                         .text("Goodbye");
//                     bot.send(reply);
//                 }
//             });
//         }
//     }
// });

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});

bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

    botbuilder: function (session, next) {
        addPersistentMenu()
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
                   var welcomeCard = new builder.HeroCard(session)
                    .title('Palace Messenger bot')
                    .subtitle(`Wanna party tonight? Click Main Menu so I can help!`)
                    .images([
                        new builder.CardImage(session)
                        .url(`${CONSTANTS.BASE_URL}/assets/logo.jpg`)
                        .alt('Logo')
                        ])
                    .buttons([
                        builder.CardAction.imBack(session, "menu", "Main Menu"),
                        ]);

                    session.send(new builder.Message(session)
                        .addAttachment(welcomeCard));

                    session.beginDialog('/firstRun');
                    next();
                } else { 
                    session.userData.firstRun = true;
                    var welcomeCard = new builder.HeroCard(session)
                    .title('Palace Messenger bot')
                    .subtitle(`Wanna party tonight? Click Main Menu so I can help!`)
                    .images([
                        new builder.CardImage(session)
                        .url(`${CONSTANTS.BASE_URL}/assets/logo.jpg`)
                        .alt('Logo')
                        ])
                    .buttons([
                        builder.CardAction.imBack(session, "menu", "Main Menu"),
                        ]);

                    session.send(new builder.Message(session)
                        .addAttachment(welcomeCard));

                    session.beginDialog('/firstRun');
                    next();
                }
            });
            
        } else {
            next();
        }
    }
});

bot.dialog('/', intentDialog);

bot.dialog('/menu', Menu).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

function venueCards() {
    
}

function eventCards() {


} 

function addPersistentMenu(){
 request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAANW2ZALpyZAABANrZAuKgOkZC69lsLkziaA6wsNEMOZAqRgBzguyGvJEkCa7mfA7nw6ewlJq5cHdUytcBqz5YwhcZCDmPPdI12hTh48yjhwOULtIm9yokJ8bm7BUbmZAPALIwXlev1g6mcmWveWZCCjO7bXgFOA5hqtOvjZBPWtSZCwZDZD',
    method: 'POST',
    json:{
        setting_type : "call_to_actions",
        thread_state : "existing_thread",
        call_to_actions:[
            {
              type:"postback",
              title:"Home",
              payload:"home"
            },
            {
              type:"postback",
              title:"Joke",
              payload:"joke"
            },
            {
              type:"web_url",
              title:"DMS Software Website",
              url:"http://www.dynamic-memory.com/"
            }
          ]
    }

}, function(error, response, body) {
    console.log(response)
    if (error) {
        console.log('Error sending messages: ', error)
    } else if (response.body.error) {
        console.log('Error: ', response.body.error)
    }
})

}



intentDialog.onDefault([
    function(session, next) {
        session.replaceDialog('/default', session.message.text);
    }
]);

bot.dialog('/default', DefaultDiag);

