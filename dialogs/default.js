// ./menu.js
var restify = require('restify'),
    builder = require('botbuilder'),
    async = require('async')
_ = require('underscore'),
    parser = require('../parser'),
    fs = require('fs'),
    request = require('request');
var builder = require('botbuilder');
var WIT_TOKEN = 'PV2AAMIGQGQTVTVPMO743XZDQITEDCVJ';
const {Wit, log} = require('node-wit');
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
                console.log(body);
                // if (!err) {
                //     var reply = body.reply[Math.floor(Math.random() * body.reply.length)]
                //     builder.Prompts.text(session, reply);
                //     session.endDialog();

                // } else {
                //     var defaultreplies = ["Sorry, I didn’t quite understand that yet since I’m still a learning bot. Let me store that for future reference.",
                //         "I think you might have misspelled something.",
                //         "Sorry, I don't understand what you are trying to say but let me save that so I can pick that up later."
                //     ]
                //     var reply = defaultreplies[Math.floor(Math.random() * defaultreplies.length)]
                //     builder.Prompts.text(session, reply);
                //     session.endDialog();
                //     var createParams = {
                //         entity: entity
                //     };
                //     parser.queries.createQuery(createParams, function (err, response, body) {
                //     });
                //     session.endDialog();
                // }

                const client = new Wit({accessToken: WIT_TOKEN});

                client.message(entity, {})
                .then((data) => {
                    var results = data;
                    var entities = results.entities;

                    if(Object.keys(entities).length == 0){
                        if(entity !== 'GET_STARTED'){
                            var randomReply = [ 'My bad, I didn\'t really understand that. Can you ask it a different way?',
                                    'Sorry, I\'m still learning a few things. Can you try to say that in a different way?',
                                    'Ok, now I feel like a dumb dumb. Want me to pass that along to your coach?' ]
                            var defaultReply = randomReply[Math.floor(Math.random() * randomReply.length)];

                            session.send(defaultReply);
                        }
                    }else{
                        var intent = entities.intent[0].value;
                        if(('inquiry_type' in entities)){var inquiry_type = entities.inquiry_type[0].value;}
                        if(('emotion' in entities)){var emotion = entities.emotion[0].value;}
                        getWitIntents(intent, inquiry_type, emotion, session);
                        session.endDialog();      
                    }
                })
                .catch(console.error);

            });
        }
    },

]

// Wit.AI
function getWitIntents(intent, inquiry_type, emotion, session){

    switch(intent){

        case 'get_greeting':
            var randomReply = [ 'Hey there! Need some fitness motivation? Type "Get Started" and I\'ll get things started.',
                                'What\'s going on? Welcome to GOtivation!',
                                'Hi buddy :)',
                                'Hi workout buddy!',
                                'Oh, hello!' ]
            var greetReply = randomReply[Math.floor(Math.random() * randomReply.length)];

            session.endConversation(greetReply);
        break;

        case 'get_farewell':
            var randomReply = [ 'Have a good workout!',
                                'Have a healthy day!',
                                'See ya later!',
                                'Cheers!',
                                'Later!' ]
            var farewellReply = randomReply[Math.floor(Math.random() * randomReply.length)];

            session.endConversation(farewellReply);
        break;

        case 'get_YoureWelcome':
            var randomReply = [ 'Ever seen an orange chatbot blush? :$',
                                'Woot! I\'m so glad you like it!',
                                'You should share that link with your friends! Post it and help motivate them :)',
                                '<3',
                                'You\'re totally welcome!' ]
            var appreciateReply = randomReply[Math.floor(Math.random() * randomReply.length)];

            session.endConversation(appreciateReply);
        break;

        case 'get_profanity':
             var randomReply = [ 'Sorry I\'m not doing a great job. I\'m trying to get better though - any suggestions?',
                                'Whoa - let\'s not roid rage. Grab a foam roller and try to relax.',
                                'Ha - I can take a hint! See ya.' ]
            var profanityReply = randomReply[Math.floor(Math.random() * randomReply.length)];

            session.endConversation(profanityReply);
        break;

        case 'get_inquiry':

            switch(inquiry_type){

                case 'delivery_time':
                    console.log('delivery_time');
                    session.endConversation('Easy! Just type "Change Time" and you can adjust when I send you motivation.');
                break;

                case 'profile':
                    var randomReply = [ 'You bet. Just type "Start over" and you can answer the questions again.',
                                        'Well, your motivation is based on the questions you initially answered. If you want to re-answer the questions, just type "Start over"',
                                        'I saved your profile based on the onboarding questions you answered. If you want to change your profile, just re-answer the questions by typing "Start over"',
                                        'If you want to redo all of your onboarding questions, just type "Start over"' ]
                    var profileReply = randomReply[Math.floor(Math.random() * randomReply.length)];

                    session.endConversation(profileReply);
                break;

                case 'overview':
                    console.log('overview');
                    session.send('I\'m a chatbot that helps you stay motivated on your fitness journey. Once a day, I\'ll message you some personalized motivation based on your goals and cool motivational psychology. Wanna try it out? Just type "Get Started"');
                break;

                default:
                    var randomReply = [ 'My bad, I didn\'t really understand that. Can you ask it a different way?',
                                'Sorry, I\'m still learning a few things. Can you try to say that in a different way?',
                                'Ok, now I feel like a dumb dumb. Want me to pass that along to your coach?' ]
                    var defaultReply = randomReply[Math.floor(Math.random() * randomReply.length)];

                    session.endConversation(defaultReply);
                break;
            }

        break;

        case 'get_help':
            session.endConversation('I\'d be happy to give you a spot ;) What sort of help do you need?\n\n' +
                                    'Type - "Start Over" if you want to redo ALL of your onboarding questions\n\n' +
                                    'Type - "Change Time" if you want to change the time when I send you motivation');
        break;

        case 'get_emotion':
            setEmotionReply(emotion, session);
        break;

        default:
            var randomReply = [ 'My bad, I didn\'t really understand that. Can you ask it a different way?',
                                'Sorry, I\'m still learning a few things. Can you try to say that in a different way?',
                                'Ok, now I feel like a dumb dumb. Want me to pass that along to your coach?' ]
            var defaultReply = randomReply[Math.floor(Math.random() * randomReply.length)];

            session.endConversation(defaultReply);
        break;

    }

}

function setEmotionReply(emotion, session){
    var reply = {
        excited: [  'Ha - glad you\'re excited!', 'I feel the same way :D', 'Ha - I\'m pumped you like it!']
    }

    if(emotion == 'excited'){
        var excitedReply = reply.excited[Math.floor(Math.random() * reply.excited.length)];
        session.endConversation(excitedReply);
    }

}