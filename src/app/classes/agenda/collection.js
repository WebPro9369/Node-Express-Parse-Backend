define([
    'parse',
    './model'
], function(Parse, Model) {
	
	var collection = Parse.Collection.extend({
		
		model : Model,
		
		
		changed : function() {
			
			return this.filter(
				
				function(model) {
					return model.dirty();
				}
				
			);
			
		},
		
		
		orderChanged : function() {
			
			return this.filter(
				
				function(model) {
					return model.isOrderChanged();
				}
				
			);
			
		},
		
		
		orderApply : function() {
			
			return this.each(
				
				function(model) {
					model.doOrderApply();
				}
				
			);
			
		}
	
	});
	
	return collection;

});