var builder = builder = require('botbuilder'),
    parser = require('../parser'),
    Constants = require('../constants');
module.exports = [
    function (session, args, next) {
        var category = args.category;
        var membercategory = []
        var params = {
            memberId: session.message.address.user.id
        }
        parser.member.getmember(params, function (error, response, getbody) {
            if (!error && response.statusCode == 200) {
                membercategory = getbody.category;

                if (category != "")
                    membercategory.push(category);

                if (category == []) {
                    session.dialogData.category = membercategory;
                    next();

                }
                else {
                    updateParams = {
                        member_id: getbody._id,
                        facebook_page_access_token: Constants.FB_PAGE_ACCESS_TOKEN,
                        category: membercategory
                    };
                    parser.member.updatemember(updateParams, function (err, res, body) {
                        if (!err && res.statusCode == 200) {
                            session.dialogData.category = body.category;
                            next();

                        }
                        else {
                            console.log(err);
                            next();

                        }
                    });
                }
            } else {
                var createParams = {
                    memberid: session.message.address.user.id,
                    channel: session.message.address.channelId,
                    facebook_page_access_token: Constants.FB_PAGE_ACCESS_TOKEN
                };
                parser.member.createmember(createParams, function (err, res, body) {
                    if (!err && res.statusCode == 200) {
                        session.dialogData.category = body.category;
                        next();
                    }
                    else {
                        console.log(err);
                        next();

                    }
                });
            }
        });
    },
    function (session, results) {
        if(session.dialogData.category){
            session.endDialogWithResult({ response: session.dialogData });
        }
    }
]
