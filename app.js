'use strict';

var restify = require('restify');
var builder = require('botbuilder');
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var partyBot = require('partybot-http-client');
// var Reply = require('reply');
var ORGANISATION_ID =  "5800471acb97300011c68cf7";
var VENUE_ID = "5800889684555e0011585f3c";
//=========================================================
// Database Setup
//=========================================================

mongoose.connect(process.env.MONGODB_URI);

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
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

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
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
    },
    function (session, results) {
        // Display menu
        session.beginDialog('/menu');
    },
    function (session, results) {
        // Always say goodbye
        session.send("See you at The Palace!");
    }
]);

bot.dialog('/menu', [
    function (session) {
        builder.Prompts.choice(session, "What can I do for you?", "Guest List|Book a Table|Buy Tickets|exit");
    },
    function (session, results) {
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
                case 'exit':
                    session.endDialog();
                    break;  
            } 
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
                session.send("Which venue would you like to get in the guest list for?");
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

    // function (session) {
    //     session.send("Which venue would you like to get in the guest list for?");
    //     // Ask the user to select an item from a carousel.
    //     var msg = new builder.Message(session)
    //         .textFormat(builder.TextFormat.xml)
    //         .attachmentLayout(builder.AttachmentLayout.carousel)
    //         .attachments([
    //             new builder.HeroCard(session)
    //                 .title("Valkyrie")
    //                 .text("Description of Valkyrie.")
    //                 .images([
    //                     builder.CardImage.create(session, 
    //                     "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")
    //                         .tap(builder.CardAction.showImage(session, 
    //                         "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")),
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "http://valkyrie.thepalacemanila.com", "Webpage"),
    //                     builder.CardAction.imBack(session, "select:100", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("Revel")
    //                 .text("Description of Revel")
    //                 .images([
    //                     builder.CardImage.create(session, 
    //                     "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/12936646_769083589893653_1821227043396906639_n.jpg?oh=8e6011d47c7ce9457d66a1fd5191cd6c&oe=586B47CA")
    //                         .tap(builder.CardAction.showImage(session, 
    //                         "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/12936646_769083589893653_1821227043396906639_n.jpg?oh=8e6011d47c7ce9457d66a1fd5191cd6c&oe=586B47CA")),
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "http://revel.thepalacemanila.com", "Webpage"),
    //                     builder.CardAction.imBack(session, "select:101", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("Pool Club")
    //                 .text("Description of Pool Club")
    //                 .images([
    //                     builder.CardImage.create(session, 
    //                     "http://manilaclubbing.com/wp-content/uploads/the-palace-pool-club-manila.jpg")
    //                         .tap(builder.CardAction.showImage(session, 
    //                         "http://manilaclubbing.com/wp-content/uploads/the-palace-pool-club-manila.jpg"))
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "http://poolclub.thepalacemanila.com", "Webpage"),
    //                     builder.CardAction.imBack(session, "select:102", "Select")
    //                 ])
    //         ]);
    //     builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    // },
    // function (session, results) {

    //     var action, item;
    //     var kvPair = results.response.entity.split(':');
    //     switch (kvPair[0]) {
    //         case 'select':
    //             action = 'selected';
    //             break;
    //     }
    //     switch (kvPair[1]) {
    //         case '100':
    //             item = "Valkyrie";
    //             break;
    //         case '101':
    //             item = "Revel";
    //             break;
    //         case '102':
    //             item = "Pool Club";
    //             break;
    //     }

    //     session.dialogData.venue = item;
    //     session.userData[`${session.dialogData.venue}`] = session.userData[`${session.dialogData.venue}`] || {};
    //     session.send(`Here are the events you can go to this week at ${session.dialogData.venue}`);
    //     // Ask the user to select an item from a carousel.
    //     var msg = new builder.Message(session)
    //         .textFormat(builder.TextFormat.xml)
    //         .attachmentLayout(builder.AttachmentLayout.carousel)
    //         .attachments([
    //             new builder.HeroCard(session)
    //                 .title("Thursday")
    //                 .text("Thursday Event Description")
    //                 .images([
    //                     builder.CardImage.create(session, 
    //                     "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14495447_664615407032155_3623638486678869431_n.jpg?oh=de9fe103b07a1ae37771b2c129e44934&oe=589F0A91")
    //                         .tap(builder.CardAction.showImage(session, 
    //                         "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14495447_664615407032155_3623638486678869431_n.jpg?oh=de9fe103b07a1ae37771b2c129e44934&oe=589F0A91")),
    //                 ])
    //                 .buttons([
    //                     // builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:100", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("Friday")
    //                 .text("Friday Event Description")
    //                 .images([
    //                     builder.CardImage.create(session, 
    //                     "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14581387_665337240293305_7019279821657993773_n.jpg?oh=e5840a625f10589cc64b6b2716694247&oe=5865458E")
    //                         .tap(builder.CardAction.showImage(session, 
    //                         "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14581387_665337240293305_7019279821657993773_n.jpg?oh=e5840a625f10589cc64b6b2716694247&oe=5865458E")),
    //                 ])
    //                 .buttons([
    //                     // builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:101", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("Saturday")
    //                 .text("Saturday Event Description")
    //                 .images([
    //                     builder.CardImage.create(session, 
    //                     "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14581387_665337240293305_7019279821657993773_n.jpg?oh=e5840a625f10589cc64b6b2716694247&oe=5865458E")
    //                         .tap(builder.CardAction.showImage(session, 
    //                         "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14581387_665337240293305_7019279821657993773_n.jpg?oh=e5840a625f10589cc64b6b2716694247&oe=5865458E"))
    //                 ])
    //                 .buttons([
    //                     // builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:102", "Select")
    //                 ])
    //         ]);
    //     builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    // },
    // function (session, results) {
    //     var action, item;
    //     var kvPair = results.response.entity.split(':');
    //     switch (kvPair[0]) {
    //         case 'select':
    //             action = 'selected';
    //             break;
    //     }
    //     switch (kvPair[1]) {
    //         case '100':
    //             item = "Thursday Event";
    //             break;
    //         case '101':
    //             item = "Friday Event";
    //             break;
    //         case '102':
    //             item = "Saturday Event";
    //             break;
    //     }
    //     session.dialogData.event = item;
    //     session.beginDialog('/ensure-party');
    // },
    // function (session, results) {
    //     session.dialogData.party = results;
    //     if (session.userData.promoCode) {
    //         results.response = 'yes';
    //         next(session, results.response);
    //     } else {
    //         builder.Prompts.confirm(session, 'Great! Do you have a promoter code?');
    //     }
    // }, 
    // function (session, results, next) {
    //     var choice = results.response ? 'yes' : 'no';
    //     if (choice === 'yes') {
    //         session.beginDialog('/ensure-promoter-code', session.dialogData);
    //     } else {
    //         next();
    //     }
    // },
    // function (session, results) {
    //     if (results.response && results.response === 'valid') {
    //         session.endDialog(`You,${session.dialogData.party.toString()} has/have now been successfully guest listed \
    //         for ${session.dialogData.event} at ${session.dialogData.venue}! \
    //         Your name will be under ${session.userData[`${session.dialogData.venue}`].promoter} \
    //         so please bring a valid ID with birth date.\n \
    //         Remember to be there before the 12MN cutoff and follow the dress code. \
    //         Note that the management has the right to refuse entry at all times.`);
    //     } else {
    //         session.endDialog(`We have received your guest list request for ${session.dialogData.event} with ${session.dialogData.party.toString()}. Kindly wait for approval from us soon. Note that we have the right to decline guests that do not pass our standards.`)
    //     }
    // }
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
    // function (session) {
    //     session.send('Which venue would you like to book a table at?');
    //     // Ask the user to select an item from a carousel.
    //     var msg = new builder.Message(session)
    //         .textFormat(builder.TextFormat.xml)
    //         .attachmentLayout(builder.AttachmentLayout.carousel)
    //         .attachments([
    //             new builder.HeroCard(session)
    //                 .title("Space Needle")
    //                 .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:100", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("Pikes Place Market")
    //                 .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/800px-PikePlaceMarket.jpg")),
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:101", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("EMP Museum")
    //                 .text("<b>EMP Musem</b> is a leading-edge nonprofit museum, dedicated to the ideas and risk-taking that fuel contemporary popular culture.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/320px-Night_Exterior_EMP.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/800px-Night_Exterior_EMP.jpg"))
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:102", "Select")
    //                 ])
    //         ]);
    //     builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    // },
    // function (session, results) {
    //     var action, item;
    //     var kvPair = results.response.entity.split(':');
    //     switch (kvPair[0]) {
    //         case 'select':
    //             action = 'selected';
    //             break;
    //     }
    //     switch (kvPair[1]) {
    //         case '100':
    //             item = "the <b>Space Needle Event</b>";
    //             break;
    //         case '101':
    //             item = "<b>Pikes Place Market Event</b>";
    //             break;
    //         case '102':
    //             item = "the <b>EMP Museum Event</b>";
    //             break;
    //     }
        
    //     var venue = session.dialogData.venue = item;
    //     session.userData[`${venue}`] = session.userData[`${venue}`] || {};
    //     session.send(`Here are the events you can go to this week at ${venue}. When would you like to reserve a table?`);
    //     // Ask the user to select an item from a carousel.
    //     var msg = new builder.Message(session)
    //         .textFormat(builder.TextFormat.xml)
    //         .attachmentLayout(builder.AttachmentLayout.carousel)
    //         .attachments([
    //             new builder.HeroCard(session)
    //                 .title("Space Needle")
    //                 .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:100", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("Pikes Place Market")
    //                 .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/800px-PikePlaceMarket.jpg")),
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:101", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("EMP Museum")
    //                 .text("<b>EMP Musem</b> is a leading-edge nonprofit museum, dedicated to the ideas and risk-taking that fuel contemporary popular culture.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/320px-Night_Exterior_EMP.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/800px-Night_Exterior_EMP.jpg"))
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:102", "Select")
    //                 ])
    //         ]);
    //     builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    // },
    // function (session, results) {
    //     var action, item;
    //     var kvPair = results.response.entity.split(':');
    //     switch (kvPair[0]) {
    //         case 'select':
    //             action = 'selected';
    //             break;
    //     }
    //     switch (kvPair[1]) {
    //         case '100':
    //             item = "the <b>Space Needle Event</b>";
    //             break;
    //         case '101':
    //             item = "<b>Pikes Place Market Event</b>";
    //             break;
    //         case '102':
    //             item = "the <b>EMP Museum Event</b>";
    //             break;
    //     }
        
    //     var event = session.dialogData.event = item;

    //     session.send(`Great! Which table do you prefer?`);
    //     // Ask the user to select an item from a carousel.
    //     var msg = new builder.Message(session)
    //         .textFormat(builder.TextFormat.xml)
    //         .attachmentLayout(builder.AttachmentLayout.carousel)
    //         .attachments([
    //             new builder.HeroCard(session)
    //                 .title("Space Needle")
    //                 .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:100", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("Pikes Place Market")
    //                 .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/800px-PikePlaceMarket.jpg")),
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:101", "Select")
    //                 ]),
    //             new builder.HeroCard(session)
    //                 .title("EMP Museum")
    //                 .text("<b>EMP Musem</b> is a leading-edge nonprofit museum, dedicated to the ideas and risk-taking that fuel contemporary popular culture.")
    //                 .images([
    //                     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/320px-Night_Exterior_EMP.jpg")
    //                         .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/800px-Night_Exterior_EMP.jpg"))
    //                 ])
    //                 .buttons([
    //                     builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Wikipedia"),
    //                     builder.CardAction.imBack(session, "select:102", "Select")
    //                 ])
    //         ]);
    //     builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    // },
    // function (session, results) {
    //     var action, item;
    //     var kvPair = results.response.entity.split(':');
    //     switch (kvPair[0]) {
    //         case 'select':
    //             action = 'selected';
    //             break;
    //     }
    //     switch (kvPair[1]) {
    //         case '100':
    //             item = "the <b>Space Needle Event</b>";
    //             break;
    //         case '101':
    //             item = "<b>Pikes Place Market Event</b>";
    //             break;
    //         case '102':
    //             item = "the <b>EMP Museum Event</b>";
    //             break;
    //     }

    //     var table = session.dialogData.table = item;
    //     session.beginDialog('/ensure-table', session.dialogData.table);
    // },

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

// bot.dialog('/prompts', [
//     function (session) {
//         session.send("Our Bot Builder SDK has a rich set of built-in prompts that simplify asking the user a series of questions. This demo will walk you through using each prompt. Just follow the prompts and you can exit at any time by saying 'cancel'.");
//         builder.Prompts.text(session, "Prompts.text()\n\nEnter some text and I'll say it back.");
//     },
//     function (session, results) {
//         session.send("You entered '%s'", results.response);
//         builder.Prompts.number(session, "Prompts.number()\n\nNow enter a number.");
//     },
//     function (session, results) {
//         session.send("You entered '%s'", results.response);
//         session.send("Bot Builder includes a rich choice() prompt that lets you offer a user a list choices to pick from. On Skype these choices by default surface using buttons if there are 3 or less choices. If there are more than 3 choices a numbered list will be used but you can specify the exact type of list to show using the ListStyle property.");
//         builder.Prompts.choice(session, "Prompts.choice()\n\nChoose a list style (the default is auto.)", "auto|inline|list|button|none");
//     },
//     function (session, results) {
//         var style = builder.ListStyle[results.response.entity];
//         builder.Prompts.choice(session, "Prompts.choice()\n\nNow pick an option.", "option A|option B|option C", { listStyle: style });
//     },
//     function (session, results) {
//         session.send("You chose '%s'", results.response.entity);
//         builder.Prompts.confirm(session, "Prompts.confirm()\n\nSimple yes/no questions are possible. Answer yes or no now.");
//     },
//     function (session, results) {
//         session.send("You chose '%s'", results.response ? 'yes' : 'no');
//         builder.Prompts.time(session, "Prompts.time()\n\nThe framework can recognize a range of times expressed as natural language. Enter a time like 'Monday at 7am' and I'll show you the JSON we return.");
//     },
//     function (session, results) {
//         session.send("Recognized Entity: %s", JSON.stringify(results.response));
//         builder.Prompts.attachment(session, "Prompts.attachment()\n\nYour bot can wait on the user to upload an image or video. Send me an image and I'll send it back to you.");
//     },
//     function (session, results) {
//         var msg = new builder.Message(session)
//             .ntext("I got %d attachment.", "I got %d attachments.", results.response.length);
//         results.response.forEach(function (attachment) {
//             msg.addAttachment(attachment);    
//         });
//         session.endDialog(msg);
//     }
// ]);

// bot.dialog('/picture', [
//     function (session) {
//         session.send("You can easily send pictures to a user...");
//         var msg = new builder.Message(session)
//             .attachments([{
//                 contentType: "image/jpeg",
//                 contentUrl: "http://www.theoldrobots.com/images62/Bender-18.JPG"
//             }]);
//         session.endDialog(msg);
//     }
// ]);

// bot.dialog('/cards', [
//     function (session) {
//         session.send("You can use Hero & Thumbnail cards to send the user visually rich information...");

//         var msg = new builder.Message(session)
//             .textFormat(builder.TextFormat.xml)
//             .attachments([
//                 new builder.HeroCard(session)
//                     .title("Hero Card")
//                     .subtitle("Space Needle")
//                     .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
//                     .images([
//                         builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
//                     ])
//                     .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
//             ]);
//         session.send(msg);

//         msg = new builder.Message(session)
//             .textFormat(builder.TextFormat.xml)
//             .attachments([
//                 new builder.ThumbnailCard(session)
//                     .title("Thumbnail Card")
//                     .subtitle("Pikes Place Market")
//                     .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
//                     .images([
//                         builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
//                     ])
//                     .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market"))
//             ]);
//         session.endDialog(msg);
//     }
// ]);

// bot.dialog('/list', [
//     function (session) {
//         session.send("You can send the user a list of cards as multiple attachments in a single message...");

//         var msg = new builder.Message(session)
//             .textFormat(builder.TextFormat.xml)
//             .attachments([
//                 new builder.HeroCard(session)
//                     .title("Hero Card")
//                     .subtitle("Space Needle")
//                     .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
//                     .images([
//                         builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
//                     ]),
//                 new builder.ThumbnailCard(session)
//                     .title("Thumbnail Card")
//                     .subtitle("Pikes Place Market")
//                     .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
//                     .images([
//                         builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
//                     ])
//             ]);
//         session.endDialog(msg);
//     }
// ]);

// bot.dialog('/carousel', [
//     function (session) {
//         session.send("You can pass a custom message to Prompts.choice() that will present the user with a carousel of cards to select from. Each card can even support multiple actions.");
        
//         // Ask the user to select an item from a carousel.
//         var msg = new builder.Message(session)
//             .textFormat(builder.TextFormat.xml)
//             .attachmentLayout(builder.AttachmentLayout.carousel)
//             .attachments([
//                 new builder.HeroCard(session)
//                     .title("Space Needle")
//                     .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
//                     .images([
//                         builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
//                             .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
//                     ])
//                     .buttons([
//                         builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
//                         builder.CardAction.imBack(session, "select:100", "Select")
//                     ]),
//                 new builder.HeroCard(session)
//                     .title("Pikes Place Market")
//                     .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
//                     .images([
//                         builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
//                             .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/800px-PikePlaceMarket.jpg")),
//                     ])
//                     .buttons([
//                         builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Wikipedia"),
//                         builder.CardAction.imBack(session, "select:101", "Select")
//                     ]),
//                 new builder.HeroCard(session)
//                     .title("EMP Museum")
//                     .text("<b>EMP Musem</b> is a leading-edge nonprofit museum, dedicated to the ideas and risk-taking that fuel contemporary popular culture.")
//                     .images([
//                         builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/320px-Night_Exterior_EMP.jpg")
//                             .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/800px-Night_Exterior_EMP.jpg"))
//                     ])
//                     .buttons([
//                         builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Wikipedia"),
//                         builder.CardAction.imBack(session, "select:102", "Select")
//                     ])
//             ]);
//         builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
//     },
//     function (session, results) {
//         var action, item;
//         var kvPair = results.response.entity.split(':');
//         switch (kvPair[0]) {
//             case 'select':
//                 action = 'selected';
//                 break;
//         }
//         switch (kvPair[1]) {
//             case '100':
//                 item = "the <b>Space Needle</b>";
//                 break;
//             case '101':
//                 item = "<b>Pikes Place Market</b>";
//                 break;
//             case '102':
//                 item = "the <b>EMP Museum</b>";
//                 break;
//         }
//         session.endDialog('You %s "%s"', action, item);
//     }    
// ]);

// bot.dialog('/receipt', [
//     function (session) {
//         session.send("You can send a receipts for purchased good with both images and without...");
        
//         // Send a receipt with images
//         var msg = new builder.Message(session)
//             .attachments([
//                 new builder.ReceiptCard(session)
//                     .title("Recipient's Name")
//                     .items([
//                         builder.ReceiptItem.create(session, "$22.00", "EMP Museum").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/a/a0/Night_Exterior_EMP.jpg")),
//                         builder.ReceiptItem.create(session, "$22.00", "Space Needle").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/7/7c/Seattlenighttimequeenanne.jpg"))
//                     ])
//                     .facts([
//                         builder.Fact.create(session, "1234567898", "Order Number"),
//                         builder.Fact.create(session, "VISA 4076", "Payment Method"),
//                         builder.Fact.create(session, "WILLCALL", "Delivery Method")
//                     ])
//                     .tax("$4.40")
//                     .total("$48.40")
//             ]);
//         session.send(msg);

//         // Send a receipt without images
//         msg = new builder.Message(session)
//             .attachments([
//                 new builder.ReceiptCard(session)
//                     .title("Recipient's Name")
//                     .items([
//                         builder.ReceiptItem.create(session, "$22.00", "EMP Museum"),
//                         builder.ReceiptItem.create(session, "$22.00", "Space Needle")
//                     ])
//                     .facts([
//                         builder.Fact.create(session, "1234567898", "Order Number"),
//                         builder.Fact.create(session, "VISA 4076", "Payment Method"),
//                         builder.Fact.create(session, "WILLCALL", "Delivery Method")
//                     ])
//                     .tax("$4.40")
//                     .total("$48.40")
//             ]);
//         session.endDialog(msg);
//     }
// ]);

// bot.dialog('/signin', [ 
//     function (session) { 
//         // Send a signin 
//         var msg = new builder.Message(session) 
//             .attachments([ 
//                 new builder.SigninCard(session) 
//                     .text("You must first signin to your account.") 
//                     .button("signin", "http://example.com/") 
//             ]); 
//         session.endDialog(msg); 
//     } 
// ]); 


// bot.dialog('/actions', [
//     function (session) { 
//         session.send("Bots can register global actions, like the 'help' & 'goodbye' actions, that can respond to user input at any time. You can even bind actions to buttons on a card.");

//         var msg = new builder.Message(session)
//             .textFormat(builder.TextFormat.xml)
//             .attachments([
//                 new builder.HeroCard(session)
//                     .title("Hero Card")
//                     .subtitle("Space Needle")
//                     .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
//                     .images([
//                         builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
//                     ])
//                     .buttons([
//                         builder.CardAction.dialogAction(session, "weather", "Seattle, WA", "Current Weather")
//                     ])
//             ]);
//         session.send(msg);

//         session.endDialog("The 'Current Weather' button on the card above can be pressed at any time regardless of where the user is in the conversation with the bot. The bot can even show the weather after the conversation has ended.");
//     }
// ]);

// // Create a dialog and bind it to a global action
// bot.dialog('/weather', [
//     function (session, args) {
//         session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
//     }
// ]);
// bot.beginDialogAction('weather', '/weather'); 