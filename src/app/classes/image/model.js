define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('Image', {
		
		_types: {
			thumb					: Parse.File,
			binary2x				: Parse.File,
			binary2x667h			: Parse.File,
			binary3x				: Parse.File,
			original				: Parse.File,
			alignment				: String,
			title					: String,
			href					: String
		}
		
	});
	
	return model;

});