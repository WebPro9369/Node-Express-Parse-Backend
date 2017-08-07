define([
	'moment',
    'parse',
    './model'
], function(moment, Parse, Model) {
	
	var collection = Parse.Collection.extend({
		
		model : Model,
		
		
		changed : function() {
			
			return this.filter(
				
				function(model) {
					return model.dirty();
				}
				
			);
			
		},
		
		
		nextDate : function() {
			
			var last = this.max(function (item) {return item.get('date') || null;});
			
			if ((last instanceof Parse.Object) && last.has('date'))
				return moment.utc(last.get('date')).startOf('day').add({days: 1}).toDate();
				
			else
				return moment.utc().startOf('day').toDate();
				
		},
		
		
		checkDate : function(date) {
			
			var item = this.find(function (item) {return item.has('date') && item.get('date').getTime() === date.getTime();});
			
			return item instanceof Parse.Object ? false : true;
				
		},
		
		
		listDate : function(model) {
			
			var items = this.filter(function(item) {
				return item.cid !== model.cid; 
			});
			
			return _
				.chain(items)
				.map(function (item) {
					return item.get('date');
				})
				.compact()
				.value();
				
		}
		
	
	});
	
	return collection;

});