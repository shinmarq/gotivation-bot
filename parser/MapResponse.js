

'use strict'
function MapResponse(argument) {
	if(typeof argument == 'string') {
		this.argument = JSON.parse(argument);
	}
	else if(typeof argument == 'object') {
		this.argument = argument;
	}
};

MapResponse.prototype.mapData = function() {
	return this.argument.d || this.argument.errors || this.argument;
};

module.exports=MapResponse;