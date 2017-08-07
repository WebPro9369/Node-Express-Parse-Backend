define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('StylistAvailability', {
		
		_types: {
			stylist					: Parse.Object,
			date					: Date,
			time					: Array
		}
		
	});
	
	return model;

});