// ./menu.js
var builder = require('botbuilder');
module.exports = [
    function (session) {
        var selectArray = [
            "Guest-List",
            "Book-A-Table",
            "Buy-Tickets",
            "Cancel"
        ];

        var cards = getCardsAttachments();
        var reply = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
        session.send("What Can I do for you?");
        builder.Prompts.choice(session, reply, selectArray, { retryPrompt: 'Please select one of the choices:'});
        
        function getCardsAttachments(session) {
            return [
            new builder.HeroCard(session)
            .title('Guest List')
            .images([
                builder.CardImage.create(session, 'https://partybot-rocks-palace-staging.herokuapp.com/assets/guestlist.jpg')
                ])
            .buttons([
                builder.CardAction.imBack(session, "Guest-List", "Guest List")
                ]),
            
            new builder.HeroCard(session)
            .title('Book a Table')
            .images([
                builder.CardImage.create(session, 'https://partybot-rocks-palace-staging.herokuapp.com/assets/table.jpg')
                ])
            .buttons([
                builder.CardAction.imBack(session, "Book-A-Table", "Book a Table")
                ]),
            new builder.HeroCard(session)
            .title('Buy Tickets')
            .images([
                builder.CardImage.create(session, 'https://partybot-rocks-palace-staging.herokuapp.com/assets/tickets.jpg')
                ])
            .buttons([
                builder.CardAction.imBack(session, "Buy-Tickets", "Buy Tickets")
                ]),

            new builder.HeroCard(session)
            .title('Cancel')
            .images([
                builder.CardImage.create(session, 'https://partybot-rocks-palace-staging.herokuapp.com/assets/cancel.jpg')
                ])
            .buttons([
                builder.CardAction.imBack(session, "Cancel", "Cancel")
                ])
            ]
        }
        
    },
    function (session, results) {
        // console.log(session.message.text);
        // console.log(results.response.entity);
        // console.log(results);
        if (results.response) 
        {
            switch (results.response.entity)
            {
                case 'Guest-List':
                    session.beginDialog('/guest-list');
                    break;
                case 'Book-A-Table':
                    session.beginDialog('/book-table');
                    break;
                case 'Buy-Tickets':
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
]