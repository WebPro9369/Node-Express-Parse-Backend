define([
	'underscore',
	'parse',
	
	'entities/address'
], function(
	_, Parse,
	AddressEntity
) {
	
	var model = Parse.Object.extend('Showroom', {
		
		_types: {
			name					: String,
			address					: AddressEntity,
			primary					: Boolean,
			searchable				: Array,
			indexedAt				: Date,
			published				: Boolean
		}
		
	});
	
	return model;

});