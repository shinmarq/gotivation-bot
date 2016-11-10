var Constants = require('../constants'),
    builder = require('botbuilder'),
    async = require('async');

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
    function (session, results) {
    	var kvPair = results.response.entity.split(':');
        var venueId = session.dialogData.eventId = kvPair[1];
        session.dialogData.venueId = venueId;
        var getTicketParams = {
            organisationId: session.dialogData.organisationId,
            venueId: session.dialogData.venueId,
            tags: 'ticket'
        };

        
        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getTickets, getTicketParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
            	if(err) {
                    session.send(err);
                    session.reset();
                } else {
                	session.send("Here are the ticketed events that you can go to at The Palace.");
                	builder.Prompts.choice(session, msg, selectString);
                }
            });
        function getTickets(getTicketParams, msg, callback) {
            partyBot.products.getProducts(getTicketParams, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    if(body.length > 0) {
                        callback(null, body, msg);
                    } else {
                        callback("No Tickets yet", [], null);
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
                        builder.CardAction.openUrl(session, value.ticket_url || "https://smtickets.com/events/view/4944", "Buy Ticket"),
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
        var kvPair = results.response.entity.split(':');
        var ticketId = session.dialogData.ticketId = kvPair[1];
        var getTicketParams = {
            organisationId: ORGANISATION_ID,
            venueId: VENUE_ID,
            productId: ticketId,
            tags: 'ticket'
        };
        /*
        * Water fall series
        * - Get Product Name
        * - Send Message
        */
        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getTicket, getTicketParams, msg),

            ], 
            function(err, product) {
                if(!err) {
                    session.dialogData.selectedTicket = product
                    session.send(`You've picked 1 ticket for ${product.name}`);
                    session.reset('/');
                } else { }
            });

        function getTicket(getTicketParams, msg, callback) {
            partyBot.products.getProducts(getTicketParams, function(err, res, body) {
                if(!err && res.statusCode == 200) {
                    callback(null, body);
                } else {
                    callback(body, null);
                }
            });
        }
    }
]