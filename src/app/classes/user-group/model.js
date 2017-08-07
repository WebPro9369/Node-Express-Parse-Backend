define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('UserGroup', {
		
		_types: {
			name					: String,
			description				: String,
			searchable				: Array,
			indexedAt				: Date
		}
		
	});
	
	return model;

});