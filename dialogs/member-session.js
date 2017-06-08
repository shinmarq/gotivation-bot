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
            memberId: session.message.address.user.id
        }

        parser.member.getmember(params, function (error, response, getbody) {
            if (!error && response.statusCode == 200) {
                membercategory = getbody.categories;
                console.log('check category =>', membercategory);
                if (category != "")
                    membercategory.push({ category: category });

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
            console.log('check1 category =>', session.dialogData.category);
            session.endDialogWithResult({ response: session.dialogData });
        }
    }
]
