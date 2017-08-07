define([
    'underscore',
    'parse',
    
    'text!templates/push-status/item.html'
], function(
	_, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusItem.initialize');
			
			_.bindAll(this, 'render');
			
			this.template = _.template(itemTemplate);
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusItem.render');
			
			this.$el.html(this.template(_.defaults({}, this.model.toTemplate(), {text: this.model.getTextMessage()})));
			
			return this;
			
		}
		
		
	});
	
	return view;

});