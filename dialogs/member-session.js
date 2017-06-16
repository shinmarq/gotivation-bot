var builder = builder = require('botbuilder'),
    parser = require('../parser'),
    Constants = require('../constants');
module.exports = [
    function (session, args, next) {
        var user = args.user;
        var category = args.category;
        var parcoach_id = args.coach_id || "";
        var membercategory = []

        var params = {
            memberid: session.message.address.user.id
        }

        console.log('MEMBER ID from member sesh', params);

        // GET MEMBER
        parser.member.getmember(params, function (error, response, getbody) {
            console.log('IF NOT ERROR', response);
            if (!error && response.statusCode == 200) {
                
                membercategory = getbody.categories;

                if (category != ""){membercategory.push({ category: category });}
                    
                if (membercategory == []) {
                    session.dialogData.category = membercategory;
                    next();
                }
                else {
                    if (parcoach_id != "") {
                        updateParams = {
                            member_id: getbody._id,
                            facebook_page_access_token: Constants.FB_PAGE_ACCESS_TOKEN,
                            categories: membercategory,
                            coach: parcoach_id,

                        };
                    }
                    else {
                        updateParams = {
                            member_id: getbody._id,
                            facebook_page_access_token: Constants.FB_PAGE_ACCESS_TOKEN,
                            categories: membercategory
                        };
                    } parser.member.updatemember(updateParams, function (err, res, body) {
                        if (!err && res.statusCode == 200) {
                            session.dialogData.category = body.categories;
                            next();

                        }
                        else {
                            console.log(err);
                            next();

                        }
                    });
                }
            } else {
                if (parcoach_id != "") {
                    var createParams = {
                        memberid: session.message.address.user.id,
                        channel: session.message.address.channelId,
                        facebook_page_access_token: Constants.FB_PAGE_ACCESS_TOKEN,
                        coach: parcoach_id,
                        name: {
                            first_name: user.first_name,
                            last_name: user.last_name
                        },
                        gender: user.gender

                    };
                }
                else {
                    var createParams = {
                        memberid: session.message.address.user.id,
                        channel: session.message.address.channelId,
                        facebook_page_access_token: Constants.FB_PAGE_ACCESS_TOKEN,
                        name: {
                            first_name: user.first_name,
                            last_name: user.last_name
                        },
                        gender: user.gender
                    };
                }
                parser.member.createmember(createParams, function (err, res, body) {
                    if (!err && res.statusCode == 200) {
                        console.log('from create members', body);
                        session.dialogData.category = body.categories;
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
        if (session.dialogData.category) {
            session.endDialogWithResult({ response: session.dialogData });
        }
    }
]
