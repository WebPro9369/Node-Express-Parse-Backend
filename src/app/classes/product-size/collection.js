define([
    'parse',
    './model'
], function(Parse, Model) {
	
	var collection = Parse.Collection.extend({
		
		model : Model,
		
		
		toDatasource : function() {
			
			return this.map(
				
				function(model) {
					return {id: model.id, text: model.has('name') ? model.get('name') : ''};
				}
				
			);
			
		},
		
		
		unordered : function() {
			
			return this.map(function (item) {return item;})
			
		},
		
		
		ordered : function(order) {
			
			return this.sortBy(
				
				function(model) {
					return _.indexOf(this, model.cid);
				},
				order
				
			);
			
		},
		
		
		total : function() {
			
			return this.reduce(
				
				function(memo, model) {
					return memo + (model.get('quantity') || 0);
				},
				0
				
			);
			
		},
		
		
		rangeUS : function() {
			
			return this.chain()
			.filter(
				
				function(model) {
					return model.get('quantity') > 0 && !_.isEmpty(model.get('nameUS'));
				}
				
			)
			.map(
				
				function(model) {
					return model.get('nameUS');
				}
				
			)
			.value();
			
		}
		
	});
	
	return collection;

});