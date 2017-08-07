define([
    'underscore',
    'parse',
    
    'text!templates/user/customer-profile/item.html'
], function(
	_, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'div',
	
		events : {},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileItem.initialize');
			
			_.bindAll(this, 'render');
			
			this.template = _.template(itemTemplate);
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileItem.render');
			
			var data = this.model.toTemplate();
			
			data.value = this.options.value || null;
			
			this.$el.html(this.template(data)).addClass('row');
			
			return this;
			
		}
		
		
	});
	
	return view;

});