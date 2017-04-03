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
            else if((/^buy tickets|ticket|buy ticket|tickets|tix/i.test(entity))){
                session.beginDialog('/buy-tickets');
            }
            else if((/:/i.test(entity)))
            {
                session.send("Let's start from the menu again.")
                session.beginDialog('/menu');
            }
            else if((/^address|location/i.test(entity)))
            {
                session.send("We're located at 11th Avenue corner 38th Street Uptown Bonifacio, Taguig City")
            }
            else if((/^open|operating hours|time/i.test(entity)))
            {
                session.send("The Palace Pool Club is open all days of the week from 11AM to 4AM. Valkyrie is open Wednesdays - Saturdays from 10PM - 4AM. Revel is open Mondays - Saturdays from 10PM - 5AM.")
            }
            else if((/^payment|card|credit/i.test(entity)))
            {
                session.send("We can accept cash or credit card payment only. We dont accept cheques or bank deposits as of yet.")
            }
            else if((/^vacancies|job|opening|openings/i.test(entity)))
            {
                session.send("You may send your resume to careers@thepalacemanila.com")
            }
            else if((/^number|hotline/i.test(entity)))
            {
                session.send("You may contact us through the following numbers: Valkyrie - 09176808888, Pool Club - 09176898888, Revel - 09175508888")
            }
            else if((/^school id|id/i.test(entity)))
            {
                session.send("As long as your ID has your birthdate, your picture, and full name in it then it's fine")
            }
            else if((/^door charge|charge|fee|entrance fee/i.test(entity)))
            {
                session.send("Door charge is P800 inclusive of 2 drinks already :)")
            }
            else if((/^photos/i.test(entity)))
            {
                session.send("Photos are posted on our Facebook pages! Please check Valkyrie, Pool Club and Revel Facebook pages.")
            }
            else if((/^thanks|thank/i.test(entity)))
            {
                session.send("You're welcome!")
            }
            else if((/^awesome|cool|wow/i.test(entity)))
            {
                session.send("I know right? :D")
            }
            else if((/^dress code|dress|dresscode/i.test(entity)))
            {
                session.send("Dress code is smart casual.")
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