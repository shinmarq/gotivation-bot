// ./dialogs/buy-tickets.js
module.exports = 
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
]