const builder = require('botbuilder');
const moment = require('moment-timezone');
const googleMapsClient = require('../googleMapsClient');



module.exports = [
    // Prompt user to enter the name of the city they live in
    (session, args) => {
        builder.Prompts.text(session, args.prompt);
    },
    // Use Geocoding API to retrieve location coordinates
    (session, results, next) => {
        const city = session.dialogData.city = results.response;

        // Try to geocode the name of the city
        googleMapsClient.geocode({ address: city }, (err, response) => {
            if (err) {
                console.log(err);
                return session.error(err);
            }
            // Cache the geocoding results
            session.dialogData.geocoding = response.json.results;
            next();
        });
    },
    // Determine if the user should be prompted to try again or make a choice
    (session, results, next) => {
        const geocoding = session.dialogData.geocoding;
        const numberOfResults = geocoding.length;
        if (numberOfResults === 0) {
            // Re-prompt user to enter a city
            session.replaceDialog('/setTimezone', { prompt: `I did not recognize that as a valid city, Please enter your current city.` })
        } else if (numberOfResults > 1) {
            const adresses = geocoding.reduce((addresses, result) => {
                addresses.push(result.formatted_address);
                return addresses;
            }, []);

            // Prompt user to choose from the available results
            session.send(`I found a number of cities named %s.`, session.dialogData.city);
            builder.Prompts.choice(session,
                "Enter the number that corresponds to your city.",
                adresses,
                {
                    listStyle: builder.ListStyle.list,
                    retryPrompt: "Please choose an option from the list."
                });
        } else {
            next();
        }

    },
    // Use Geocoding Timezone API
    (session, results) => {
        const geocoding = session.dialogData.geocoding;
        const { response } = results;
        const index = (response && response.hasOwnProperty('index')) ? response.index : 0;
        const location = geocoding[index].geometry.location;
        var timestamp = Math.round((new Date()).getTime() / 1000);
        googleMapsClient.timezone({ location,timestamp }, (err, response) => {
            if (err) {
                console.log(err);
                return session.error(err);
            }

            const { dstOffset, rawOffset, timeZoneId, timeZoneName } = response.json;
            // Cache the timezone result as userData
            session.userData.timeZoneData = { dstOffset, rawOffset, timeZoneId, timeZoneName };
            const time = moment.tz(timeZoneId).format('h:mm a');
            session.endDialogWithResult({ response: time });
        });
    }
];