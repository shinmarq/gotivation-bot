// ./menu.js
var restify = require('restify'),
    builder = require('botbuilder'),
    async = require('async')
    _ = require('underscore'),
    partyBot = require('partybot-http-client'),
    fs = require('fs'),
    request = require('request');
var builder = require('botbuilder');
//var defaultDialog = require('./defaultDialog.js');

const ORGANISATION_ID =  "5800471acb97300011c68cf7";
const VENUE_ID = "5800889684555e0011585f3c";
module.exports = [
    function(session,args,next) {
        var entity =  session.message.text;
       if(entity && entity.length > 0) {
            if((/^menu|show menu/i.test(entity))) {
                 session.beginDialog('/menu');
             }  
            else if((/^guest list|guest|show guest list|gl/i.test(entity))){
                session.beginDialog('/guest-list');
            }
            else if((/^book table|book a table|table book|table booking|table|couch/i.test(entity))){
                session.beginDialog('/book-table');
            }
            else if((/^buy tickets|ticket|buy ticket|tickets/i.test(entity))){
                session.beginDialog('/buy-tickets');
            }
            else {
               var params = {
                    organisationId: ORGANISATION_ID,
                    entity: entity
                };

                partyBot.queries.getQueryForBot(params, function(err, response, body) {
                    if(err) {
                        builder.Prompts.text(session,
                            'Sorry, I didn’t quite understand that yet since I’m still a learning bot. Let me store that for future reference.\n'+
                            'In the mean time, type “Menu” if you want to find out the cool things I can do for you!');
                        
                            
                        // session.replaceDialog('/menu');
                        var createParams = {
                            organisationId: ORGANISATION_ID,
                            entity: entity
                        };
                        partyBot.queries.createQuery(createParams, function(err, response, body) {

                        });
                        session.endDialog();
                    } else {
                        //callback(body.reply, [], null);
                        builder.Prompts.text(session,body.reply);
                        session.endDialog();
                    }
                });
            }
        }
    },
    
]