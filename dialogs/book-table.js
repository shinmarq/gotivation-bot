var builder = require('botbuilder'),
    async = require('async')

const ORGANISATION_ID = require('../constants').ORGANISATION_ID;
module.exports = [
    function (session) {
        var options = {
            organisationId: session.dialogData.organisationId = ORGANISATION_ID
        };

        // Get Venues
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
                    session.send("Which venue would you like to get in the guest list for?");
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
    function(session, results) {
        // Get Events
        var kvPair = results.response.entity.split(':');
        var venueId = session.dialogData.eventId = kvPair[1];
        session.dialogData.venueId = venueId;
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
                session.send("Which event would you like to book a table for?");
                builder.Prompts.choice(session, msg, selectString);
                
            });

        function getVenues(getEventsParams, msg, callback) {
            partyBot.events.getAllEventsInVenueInOrganisation(getEventsParams, function(err, res, body) {
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
    }, // End Get Events
    function(session, results) {
        // Get Tables Types
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

    function(session, results) {
        // Get Tables

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
]