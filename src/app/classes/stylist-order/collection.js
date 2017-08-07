define([
    'parse',
    './model'
], function(Parse, Model) {
	
	var collection = Parse.Collection.extend({
		
		model : Model
	
	});
	
	return collection;

});