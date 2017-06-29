const CONSTANTS = require('./constants');

const key = process.env.GOOGLE_MAPS_API_KEY || CONSTANTS.GOOGLE_MAPS_API_KEY;
const googleMapsClient = require('@google/maps').createClient({ key });

module.exports = googleMapsClient;