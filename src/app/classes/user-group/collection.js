define([
    'parse',
    './model'
], function(Parse, Model) {
	
	var collection = Parse.Collection.extend({
		
		model : Model,
		
		
		toDatasource : function() {
			
			return this.map(
				
				function(model) {
					return {id: model.get('name'), text: model.get('name')};
				}
				
			);
			
		}
	
	});
	
	return collection;

});