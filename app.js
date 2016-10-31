'use strict';

var restify = require('restify');
var builder = require('botbuilder');

var async = require('async');
var _ = require('underscore');
var partyBot = require('partybot-http-client');

var request = require('request');
var ORGANISATION_ID =  "5800471acb97300011c68cf7";
var VENUE_ID = "5800889684555e0011585f3c";
var FBPAGE_ACCESS_TOKEN = "EAANW2ZALpyZAABALnAf7FTmhOgrciIkZBBvLjH8o8gpC5m1NzBWW5xbDstkCOq8TR8ZBNsJfwHjeaUsxZBaYESyxGew1BrzkippXM8vIFHeDbvraHw59Xj4QNrrZBpreBkE7cJ1SGTIPjcBXq4e3CedZBHU6wJV3ZCfARxAZAeR438gZDZD";

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser());
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
server.get('/api/messages', function (req, res) {
    if (req.params.hub.verify_token === 'partybot_rocks') {
        res.header('Content-Type', 'text/plain');
        res.send(req.params.hub.challenge);
    } else {
        res.send('Error, wrong validation token');    
    }
});

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

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'See you at The Palace!', { matches: /^goodbye/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', intentDialog);

bot.dialog('/menu', [
    function (session) {
        builder.Prompts.choice(session, "What can I do for you?", "Guest List|Book a Table|Buy Tickets|Cancel", { retryPrompt: 'Please select one of the choices:'});
    },
    function (session, results) {
        var resultsJSONString = JSON.stringify(results);
        console.log(`results JSON: ${resultsJSONString}`);
        
        if (results.response) 
        {
            switch (results.response.entity)
            {
                case 'Guest List':
                    session.beginDialog('/guest-list');
                    break;
                case 'Book a Table':
                    session.beginDialog('/book-table');
                    break;
                case 'Buy Tickets':
                    session.beginDialog('/buy-tickets');
                    break;
                case 'Cancel':
                    session.endDialog();
                    break;
            } 
        } else {
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to exit.
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

function venueCards() {
    
}

function eventCards() {

}

bot.dialog('/guest-list', [
    function (session) {
        console.log(JSON.stringify(session.conversationData));
        session.dialogData.organisationId = ORGANISATION_ID;
        // Get Venues
        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getVenues, ORGANISATION_ID, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                session.send("Which venue would you like to get in the guest list for?");
                builder.Prompts.choice(session, msg, selectString);
                
            });

        function getVenues(organisationId, msg, callback) {
            partyBot.venues.getAllInOrganisation(organisationId, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    callback(null, body, msg);
                } else {
                    callback(body, res.statusCode);
                }
            });
        }

        function formatBody(body, msg, callback) {
            var attachments = [];
            var selectString = [];
            body.forEach(function(value, index) {
                selectString.push('select:'+value._id);
                attachments.push(
                    new builder.HeroCard(session)
                    .title(value.name)
                    .text(value.description)
                    .images([
                        builder.CardImage.create(session, value.image || 
                            "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0" )
                        .tap(builder.CardAction.showImage(session, 
                            value.image || "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")),
                        ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0", "Webpage"),
                        builder.CardAction.imBack(session, "select:"+value._id, "Select")
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
    },
    function(session, results) {
        // Get Events
        var action, item;
        var kvPair = results.response.entity.split(':');
        var venueId = session.dialogData.venueId = kvPair[1];
        var getEventsParams = {
            organisationId: session.dialogData.organisationId,
            venueId: session.dialogData.venueId
        };
        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getVenues, getEventsParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                session.send("Which Event would you like to get in the guest list for?");
                builder.Prompts.choice(session, msg, selectString);
                
            });

        function getVenues(getEventsParams, msg, callback) {
            partyBot.events.getAllEventsInVenueInOrganisation(getEventsParams, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    callback(null, body, msg);
                } else {
                    callback(body, res.statusCode);
                }
            });
        }

        function formatBody(body, msg, callback) {
            var attachments = [];
            var selectString = [];
            body.forEach(function(value, index) {
                selectString.push('select:'+value._id);
                attachments.push(
                    new builder.HeroCard(session)
                    .title(value.name)
                    .text(value.description)
                    .images([
                        builder.CardImage.create(session, value.image || 
                            "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0" )
                        .tap(builder.CardAction.showImage(session, 
                            value.image || "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")),
                        ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0", "Webpage"),
                        builder.CardAction.imBack(session, "select:"+value._id, "Select")
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
    },
    function(session, results) {
        // Enter Names
        var kvPair = results.response.entity.split(':');
        var eventId = session.dialogData.eventId = kvPair[1];
        async.waterfall([
            async.apply(getEvent, session.dialogData)
            ],
            function(err, eventName) {
                session.dialogData.event = eventName;
                session.beginDialog('/ensure-party');

            })

        function getEvent(params, callback) {
            partyBot.events.getEventInVenueInOrganisation(params, function(err, res, body) {
                callback(null, body.event.name);
            });
        }
    },
    function(session, results) {
        // Confirm Party
        var newResult = _.map(results, function(val) { return val; });
        session.dialogData.party = newResult;
        builder.Prompts.confirm(session, 'Great! Do you have a promoter code?');
    },
    function(session, results, next) {
        //  - Do you have promoter code
        //      - if yes enter promoter code
        var choice = results.response ? 'yes' : 'no';
        if (choice === 'yes') {
            session.beginDialog('/ensure-promoter-code', session.dialogData);
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response && results.response === 'valid') {
            session.endDialog(`You,${session.dialogData.party.toString()} has/have now been successfully guest listed \
            for ${session.dialogData.eventId} at ${session.dialogData.venueId}! \
            Your name will be under ${session.dialogData.promoterCode} \
            so please bring a valid ID with birth date.\n \
            Remember to be there before the 12MN cutoff and follow the dress code. \
            Note that the management has the right to refuse entry at all times.`);
        } else {
            session.endDialog(`We have received your guest list request for ${session.dialogData.event} with ${session.dialogData.party.toString()}. Kindly wait for approval from us soon. Note that we have the right to decline guests that do not pass our standards.`)
        }
    }
]);

bot.dialog('/ensure-party', [
    function (session, args, next) {
        builder.Prompts.text(session, 'Please enter the names you would like to add in the guest list (separated by a comma):');
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.party = results.response.split(',');
            builder.Prompts.confirm(session, `So ${session.dialogData.party} will join you - is this confirmed?`);
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
            builder.Prompts.text(session, `Please enter your promoter code for ${session.dialogData.venueId} now:`);
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

bot.dialog('/book-table', [
    function (session) {
        session.dialogData.organisationId = ORGANISATION_ID;
        // Get Venues
        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getVenues, ORGANISATION_ID, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                session.send('Which venue would you like to book a table at?');
                builder.Prompts.choice(session, msg, selectString);
                
            });

        function getVenues(organisationId, msg, callback) {
            partyBot.venues.getAllInOrganisation(organisationId, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    callback(null, body, msg);
                } else {
                    callback(body, res.statusCode);
                }
            });
        }

        function formatBody(body, msg, callback) {
            var attachments = [];
            var selectString = [];
            body.forEach(function(value, index) {
                selectString.push('select:'+value._id);
                attachments.push(
                    new builder.HeroCard(session)
                    .title(value.name)
                    .text(value.description)
                    .images([
                        builder.CardImage.create(session, value.image || 
                            "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0" )
                        .tap(builder.CardAction.showImage(session, 
                            value.image || "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")),
                        ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0", "Webpage"),
                        builder.CardAction.imBack(session, "select:"+value._id, "Select")
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
    },
    function(session, results) {
        // Get Tables

        var action, item;
        // var venue = session.dialogData.venue = item;
        var kvPair = results.response.entity.split(':');
        var venueId = kvPair[1];
        session.dialogData.venueId = venueId;
        var getTablesParams = {
            organisationId: ORGANISATION_ID,
            venueId: venueId,
            tags: 'table'
        };

        var msg = new builder.Message(session);

        async.waterfall([
            async.apply(getTables, getTablesParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                session.send(`Great! Which table do you prefer?`);
                builder.Prompts.choice(session, msg, selectString);
                
            });

        function getTables(getTablesParams, msg, callback) {
            partyBot.products.getProducts(getTablesParams, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    callback(null, body, msg);
                } else {
                    callback(body, res.statusCode);
                }
            });
        }

        function formatBody(body, msg, callback) {
            var attachments = [];
            var selectString = [];
            body.forEach(function(value, index) {
                selectString.push('select:'+value._id);
                attachments.push(
                    new builder.HeroCard(session)
                    .title(value.name)
                    .text(value.description)
                    .images([
                        builder.CardImage.create(session, value.image || 
                            "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0" )
                        .tap(builder.CardAction.showImage(session, 
                            value.image || "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")),
                        ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0", "Webpage"),
                        builder.CardAction.imBack(session, "select:"+value._id, "Select")
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
    },
    function(session, results) {
        // Get Table
        var kvPair = results.response.entity.split(':');
        var tableId = kvPair[1];
        session.dialogData.tableId = tableId;
        var getTableParams = {
            organisationId: session.dialogData.organisationId,
            venueId: session.dialogData.venueId,
            productId: session.dialogData.tableId,
            tags: 'table'
        };

        async.waterfall([
            async.apply(getTable, getTableParams),
            formatBody
            ],
            function(err, msgString) { // Send Message
                session.send(msgString);
                session.beginDialog('/ensure-table', session.dialogData.tableId);
            });

        function getTable(getTableParams, callback) {
            partyBot.products.getProducts(getTableParams, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    callback(null, body);
                } else {
                    callback(body, res.statusCode);
                }
            });
        }

        function formatBody(body, callback) {
            var attachments = [];
            var msgString = "You've successfully booked Table: "+body.name || '';
            callback(null, msgString);
        }
    }
]);

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

bot.dialog('/buy-tickets', [
    function (session) {
        var getTicketParams = {
            organisationId: ORGANISATION_ID,
            venueId: VENUE_ID,
            tags: 'ticket'
        };

        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getTickets, getTicketParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                session.send("Pick a Ticket");
                builder.Prompts.choice(session, msg, selectString);
                
            });
        function getTickets(getTicketParams, msg, callback) {
            partyBot.products.getProducts(getTicketParams, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    callback(null, body, msg);
                } else {
                    callback(body, res.statusCode);
                }
            });
        }

        function formatBody(body, msg, callback) {
            var attachments = [];
            var selectString = [];
            body.forEach(function(value, index) {
                selectString.push('select:'+value._id);
                attachments.push(
                    new builder.HeroCard(session)
                    .title(value.name)
                    .text(value.description)
                    .images([
                        builder.CardImage.create(session, value.image || 
                            "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0" )
                        .tap(builder.CardAction.showImage(session, 
                            value.image || "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")),
                        ])
                    .buttons([
                        builder.CardAction.openUrl(session, value.ticket_url || "httphttps://smtickets.com/events/view/4944", "Webpage"),
                        builder.CardAction.imBack(session, "select:"+value._id, "Select")
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
]);

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
        session.beginDialog('/menu');
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