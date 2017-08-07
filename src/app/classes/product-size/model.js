define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('ProductSize', {
		
		_types: {
			name					: String,
			nameUS					: String,
			product					: Parse.Object,
			quantity				: Number
		}
		
	});
	
	return model;

});