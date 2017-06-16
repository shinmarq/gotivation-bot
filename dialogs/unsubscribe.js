var builder = require('botbuilder');
var parser = require('../parser');

module.exports = [
    function (session) {
        var unsubscribe = /^unsubscribe|unsubscribed|Unsubscribe/i.test(session.message.text);

        if (unsubscribe) {
            builder.Prompts.confirm(session, `Are you sure you want to quit before we finish our fitness goal together?`);
        }
    },
    function (session, results) {
        if (results.response) {
            var params = {
                updatetype: "unsubscribe",
                memberid: session.message.address.user.id,
            }
            parser.member.updatemember(params, function (err, res, body) {
                if(!err){
                    console.log(res.statusCode);
                    console.log('success unsubscribed');
                    session.endConversation('Successfully unsubscibed. If you want to get started again with those motivations, just type "Start over"');
                }else{console.log('error occur in unsubscribing')}
            });
        } else {
            //test
            session.endConversation('Okay glad you didn\'t unsubscibe ;)');
        }

    }
]