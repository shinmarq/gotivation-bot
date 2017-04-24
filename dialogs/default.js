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
    function(session,args,next) {
        var entity =  session.message.text;
       if(entity && entity.length > 0) {
            if((/^category|categories/i.test(entity))) {
                 session.beginDialog('/onboarding');
             } 
             else if((/^hi|hello/i.test(entity))){
                session.send(`${entity} to you too :)` )
             }
             else if((/^bye|goodbye/i.test(entity))){
                session.send(`Have a great day!` )
             }
             else if((/^thanks|thank|ty/i.test(entity))){
                session.send(`You're welcome!` )
             }
            else {
               var params = {
                    entity: entity
                };

                parser.queries.getQueryForBot(params, function(err, response, body) {
                    if(err) {
                        builder.Prompts.text(session,
                            'Sorry, I didn’t quite understand that yet since I’m still a learning bot. Let me store that for future reference.\n'+
                            'In the mean time, pick from categories if you want to find out the cool things I can do for you!');
                            
                        var createParams = {
                            entity: entity
                        };
                        parser.queries.createQuery(createParams, function(err, response, body) {

                        });
                        session.endDialog();
                    } else {
                        var reply = body.reply[Math.floor(Math.random()*body.reply.length)]
                        builder.Prompts.text(session,reply);
                        session.endDialog();
                    }
                });
            }
        }
    },
    
]