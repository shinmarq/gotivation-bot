var builder = require('botbuilder'),
    async = require('async'),
    _ = require('underscore'),
    partyBot = require('partybot-http-client');
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
                        builder.CardAction.imBack(session, "select:"+value._id, value.name)
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
            venue_id: session.dialogData.venueId
        };
        var msg = new builder.Message(session);
        async.waterfall([
            async.apply(getEvents, getEventsParams, msg),
            formatBody,
            sendMessage
            ],
            function(err, msg, selectString) {
                if(err) {
                    session.send(err);
                    session.reset('/guest-list');
                } else {
                    session.send("Which Event would you like to get in the guest list for?");
                    builder.Prompts.choice(session, msg, selectString);                    
                }
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
                    .text(value.description)
                    .text(description)
                    .images([
                        builder.CardImage.create(session, value.image || 
                            "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0" )
                        .tap(builder.CardAction.showImage(session, 
                            value.image || "https://scontent.fmnl3-1.fna.fbcdn.net/v/t1.0-9/14199279_649096945250668_8615768951946316221_n.jpg?oh=2d151c75875e36da050783f91d1b259a&oe=585FC3B0")),
                        ])
                    .buttons([
                        builder.CardAction.imBack(session, "select:"+value._id, value.name)
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
            function(err, event) {
                session.dialogData.event = event.name;
                session.dialogData.venue = event._venue_id.name;
                session.beginDialog('/ensure-party', session.endDialog);

            })

        function getEvent(params, callback) {
            partyBot.events.getEventInVenueInOrganisation(params, function(err, res, body) {
                callback(null, body.event);
            });
        }
    },
    function(session, results) {
        // Confirm Party
        var newResult = _.map(results, function(val) { return val; });
        session.dialogData.party = newResult;
        console.log(session.dialogData);

        builder.Prompts.confirm(session, 'Great! Do you have a promoter code?');
    },
    function(session, results, next) {
        //  - Do you have promoter code
        //      - if yes enter promoter code
        var choice = results.response ? 'yes' : 'no';
        if (choice === 'yes') {
            session.dialogData.promoter = {};
            session.beginDialog('/ensure-promoter-code', session.dialogData);
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response && results.response.validCode == true) {
            session.dialogData.promoter = results.response;
            var params = {
                organisationId: session.dialogData.organisationId,
                order_items: [{
                    name: session.dialogData.event,
                    price: 0,
                    some_id: session.dialogData.eventId,
                    some_type: 'Event'
                }],
                status: 'approved',
                particulars: [{
                    label: 'party',
                    value: session.dialogData.party
                }],
                promoter_code: session.dialogData.promoter.promoterCode,
                order_type: 'guest-list'

            };
            createOrder(params, function(statusCode) {
                if(statusCode == 200) {
                    session.endDialog(`You have now been successfully guest listed for ${session.dialogData.event} at ${session.dialogData.venue}! Your name will be under ${session.dialogData.promoter.promoterCode} so please bring a valid ID with birth date.\n
Remember to be there before the 12MN cutoff and follow the dress code.\nNote that the management has the right to refuse entry at all times.`);
                } else {
                    session.send('Something went wrong and your order is not saved. Please try again');
                }
            });

            
        } else {
            var params = {
                organisationId: session.dialogData.organisationId,
                order_items: [{
                    name: session.dialogData.event,
                    price: 0,
                    some_id: session.dialogData.eventId,
                    some_type: 'Event'
                }],
                status: 'pending',
                particulars: [{
                    label: 'party',
                    value: session.dialogData.party
                }],
                order_type: 'guest-list'
            };

            createOrder(params, function(statusCode) {
                if(statusCode == 200) {
                    session.endDialog(`We have received your guest list request for ${session.dialogData.event}. Kindly wait for approval from us soon. Note that we have the right to decline guests that do not pass our standards.`);                    
                } else {
                    session.send('Something went wrong and your order is not saved. Please try again');
                }
            });
        }
    }
];

function createOrder(params, callback) {
    partyBot.orders.createOrder(params, function(err, response, body) {
        console.log(response.statusCode);
        callback(response.statusCode)
    });
};