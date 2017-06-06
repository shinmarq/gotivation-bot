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
                       var params = {
                                updatetype: "unsubscribed",
                                memberid: session.message.address.user.id,
                                categories: [],
                                classes: [],
                                construals: "",
                                profiletype: ""
                            }
                        parser.member.updatemember(params, function (err, res, body) {
                            console.log(res.statusCode);
                            console.log('success unsubscribed');
                        });
                    }
                } 
            });

        }
    }
]