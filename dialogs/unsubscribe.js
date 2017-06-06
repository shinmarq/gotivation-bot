var builder = require('botbuilder');
var parser = require('../parser');

module.exports = [
    function(session){
        var unsubscribe = /^unsubscribe|unsubscribed|Unsubscribe/i.test(session.message.text);

        if(unsubscribe){
            var params = {
                memberId: session.message.address.user.id
            }
            parser.member.getmember(params, function (error, response, getbody) {
                if (!error && response.statusCode == 200) {
                    var membercategory = getbody.categories;

                    if(membercategory.length == 0){
                        session.endConversation('Please select first a category.');
                    }else{
                       builder.Prompts.confirm(session, `Are you sure you want to quit before we finish our fitness goal together?`);
                    }
                } 
            });

        }
    },
    function(session, results){
        if(results.response){
            var params = {
                updatetype: "unsubscribe",
                memberid: session.message.address.user.id,
                categories: [],
                classes: [],
                construals: "",
                profiletype: ""
            }
            parser.member.updatemember(params, function (err, res, body) {
                console.log(res.statusCode);
                console.log('success unsubscribed');
                session.endConversation('Successfully unsubscibed. If you want to get started again with those motivations, just type "Start over"');
            });
        }else{
            //test
            session.endConversation('Okay glad you didn\'t unsubscibe ;)');
        }
        
    }
]