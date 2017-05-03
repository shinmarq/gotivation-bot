// ./menu.js
var restify = require('restify'),
    builder = require('botbuilder'),
    async = require('async')
_ = require('underscore'),
    parser = require('../parser'),
    fs = require('fs'),
    request = require('request');
var builder = require('botbuilder');
//var defaultDialog = require('./defaultDialog.js');

module.exports = [
    function (session, args, next) {
        var entity = session.message.text;
        if (entity && entity.length > 0) {
            // session.dialogData.party = results.response.split(/[,\n]+/).map(function (x) { return x.trim(); }) || [];    
            var params = {
                entity: entity
            };
            parser.queries.getQueryForBot(params, function (err, response, body) {

                if (!err) {
                    var reply = body.reply[Math.floor(Math.random() * body.reply.length)]
                    builder.Prompts.text(session, reply);
                    session.endDialog();

                } else {
                    var defaultreplies = ["Sorry, I didn’t quite understand that yet since I’m still a learning bot. Let me store that for future reference.", 
                    "I think you might have misspelled something but let me save that word so I can pick that up later.",
                    "Sorry, I don't understand what you are trying to say."
                    ]
                    var reply = defaultreplies[Math.floor(Math.random() * defaultreplies.length)]
                    builder.Prompts.text(session, reply);
                    session.endDialog();
                    var createParams = {
                        entity: entity
                    };
                    parser.queries.createQuery(createParams, function (err, response, body) {
                    });
                    session.endDialog();
                }
            });
        }
    },

]