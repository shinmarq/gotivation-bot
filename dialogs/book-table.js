var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    partyBot = require('partybot-http-client');

const ORGANISATION_ID = require('../constants').ORGANISATION_ID;
module.exports = [
    // Getting Venues
    function (session) {
        var options = {
            organisationId: session.dialogData.organisationId = ORGANISATION_ID
        };

        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getVenues, options, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                if(err) {
                    session.send(err);
                    session.reset();
                } else {
                    session.send('Which venue would you like to book a table at?');
                    builder.Prompts.choice(session, msg, selectString);
                }
                
            });

        function getVenues(organisationId, msg, callback) {
            partyBot.venues.getAllInOrganisation(organisationId, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    if(body.length > 0) {
                        callback(null, body, msg);
                    } else {
                        callback("No Venues yet", [], null);
                    }
                } else {
                    callback(body, res.statusCode, []);
                }
            });
        }

        function formatBody(body, msg, callback) {
            var attachments = [];
            var selectString = [];
            body.map(function(value, index) {
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

    // Getting Events
    function(session, results) {
        var kvPair = results.response.entity.split(':');
        var venueId = session.dialogData.eventId = kvPair[1];
        session.dialogData.venueId = venueId;
        var getEventsParams = {
            organisationId: session.dialogData.organisationId,
            venue_id: session.dialogData.venueId
        };
        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getEvents, getEventsParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                session.send("Which event would you like to book a table for?");
                builder.Prompts.choice(session, msg, selectString);
                
            });

        function getEvents(getEventsParams, msg, callback) {
            partyBot.events.getSorted(getEventsParams, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    if(body.length > 0) {
                        callback(null, body, msg);
                    } else {
                        callback("No Events yet", [], null);
                    }
                } else {
                    callback(body, res.statusCode);
                }
            });
        }

        function formatBody(body, msg, callback) {
            var attachments = [];
            var selectString = [];

            body.map(function(value, index) {
                var monthNames = [
                "January", "February", "March",
                "April", "May", "June", "July",
                "August", "September", "October",
                "November", "December"
                ];

                var date = new Date(value.next_date);
                var day = date.getDate();
                var monthIndex = date.getMonth();
                var year = date.getFullYear();

                var description = `${monthNames[monthIndex]} ${day} ${year}`;
                selectString.push('select:'+value._id);
                attachments.push(
                    new builder.HeroCard(session)
                    .title(value.name)
                    .text(description)
                    .images([
                        builder.CardImage.create(session, value.image || 
                            "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0" )
                        .tap(builder.CardAction.showImage(session, 
                            value.image || "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")),
                        ])
                    .buttons([
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
    }, // End Get Events

    // Getting Tables Types
    function(session, results) {
        var kvPair = results.response.entity.split(':');
        var eventId = session.dialogData.eventId = kvPair[1];
        session.dialogData.eventId = eventId;

        var getTableTypesParams = {
            organisationId: ORGANISATION_ID,
            venue_id: session.dialogData.venueId
        };

        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getTableType, getTableTypesParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                if(err) {
                    session.send(err);
                    session.reset('/book-table');
                } else {
                    session.send(`Great! Which Table Type do you prefer?`);
                    builder.Prompts.choice(session, msg, selectString);
                }
            });

        function getTableType(getTableTypesParams, msg, callback) {
            partyBot.tableTypes.getTableTypesInOrganisation(getTableTypesParams, function(err, res, body) {
                if(body.length > 0) {
                    callback(null, body, msg);
                } else {
                    callback("No Table Type", msg, null);
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

    // Get Tables
    function(session, results) {

        var action, item;
        // var venue = session.dialogData.venue = item;
        var kvPair = results.response.entity.split(':');
        var tableTypeId = kvPair[1];
        session.dialogData.tableTypeId = tableTypeId;
        var getTablesParams = {
            organisationId: session.dialogData.organisationId,
            venueId: session.dialogData.venueId,
            table_type_id: tableTypeId,
            tags: 'table'
        };

        var msg = new builder.Message(session);

        async.waterfall([
            async.apply(getTables, getTablesParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                if(!err) {
                    session.send(`Okay! Which specific table do you want?`);
                    builder.Prompts.choice(session, msg, selectString);
                } else {
                    session.send(err);
                    session.reset('/book-table');
                }
            });

        function getTables(getTablesParams, msg, callback) {
            partyBot.products.getProducts(getTablesParams, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    if(body.length > 0) {
                        callback(null, body, msg);
                    } else {
                        callback("No Tables yet", msg, null);
                    }
                } else {
                    callback(body, res.statusCode, null);
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

    // Get Table
    function(session, results) {
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
            var params = {
                organisationId: session.dialogData.organisationId,
                order_items: [{
                    name: body.name,
                    price: _.find(body.prices, function(value) {
                         return value._event._id == session.dialogData.eventId;
                    }).price || 0,
                    some_id: session.dialogData.tableId,
                    some_type: 'Product'
                }],
                status: 'pending',
                order_type: 'table-booking'
            }

            createOrder(params, function(statusCode) {
                if(statusCode == 200) { 
                    var attachments = [];
                    var msgString = "You've successfully booked Table: "+body.name || '';
                    callback(null, msgString);
                } else {
                    session.send('Something went wrong and your order is not saved. Please try again');
                    session.beginDialog('/book-table');
                }
            });
            
        }
    }
]

function createOrder(params, callback) {
    partyBot.orders.createOrder(params, function(err, response, body) {
        console.log(response.statusCode);
        callback(response.statusCode)
    });
};