define([
    'parse',
    './model'
], function(Parse, Model) {
	
	var collection = Parse.Collection.extend({
		
		model : Model,
		
		
		toDatasource : function() {
			
			return this.map(
				
				function(model) {
					return {id: model.id, text: model.has('title') ? model.get('title') : ''};
				}
				
			);
			
		},
		
		
		toTree : function(parent, values) {
			
			var items = this
				.chain()
				.filter(
					
					function (model) {
						
						if (parent instanceof Parse.Object)
							return model.has('parent') && model.get('parent').id === parent.id;
							
						else
							return !model.has('parent');
						
					}
					
				)
				.sortBy(
					
					function (model) {
						
						return model.get('sortOrder');
						
					}
					
				)
				.map(
					
					function (model) {
						
						var key = model.get('key');
						
						var item = {
							id			: key,
							text		: model.get('title'),
							state		: {
								opened	: true
							}
						};
						
						var childrens = this.toTree(model, values);
						
						if (!_.isEmpty(childrens))
							item.children = childrens;
							
						if (_.isObject(values) && _.has(values, key) && (value = values[key])) {
							
							if (_.isArray(value))
								value = value.join(', ');
							
							else if (_.isObject(value))
								value = _.map(value, function (v, k) {return k + ': ' + v;}).join(', ')
							
							else
								value = String(value);
							
							item.data = {values: value};
						}
						
						return item;
						
					},
					this
					
				)
				.value();
			
			return items;
			
		},
		
		
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