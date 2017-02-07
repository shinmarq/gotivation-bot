// ./dialogs/constants.js
module.exports.ORGANISATION_ID = "5800471acb97300011c68cf7";
module.exports.FB_PAGE_ACCESS_TOKEN = "EAANW2ZALpyZAABAFUc4spdMG6m6kwOkDtvPVaegYINUnbebowYRZABWfSeqW9WHL947O94LNcIBy2l3RfZCwr6xbaPtbM1GtlZAoPUZB5oLBxyHZCKwoLMzQUMQiZCZAhVsMZCm5hnvL2h3YmBqaeaKJzbwA82mCaRXqXHWU6fdS3kWAZDZD";
module.exports.BASE_URL = (process.env.NODE_ENV !== "production")? "http://localhost:3979" : "https://partybot-rocks-palace-staging.herokuapp.com/";
var BASE_URL = (process.env.NODE_ENV !== "production")? "http://localhost:3979" : "https://partybot-rocks-palace-staging.herokuapp.com/";
console.log(process.env.NODE_ENV);
console.log(BASE_URL);