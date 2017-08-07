define([
    'underscore',
    'numeral',
    'parse',
    
    'text!templates/product/item.html'
], function(
	_, numeral, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductItem.initialize');
			
			_.bindAll(this, 'render');
			
			this.template = _.template(itemTemplate);
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductItem.render');
			
			this.$el.html(this.template(this.model.toTemplate()));
			
			if (this.options.theme === 'gallery')
				this.$el.addClass('col-md-3 table-item');
			
			this.$el.attr('data-id', this.model.id);
			
			return this;
			
		},
		
		
		updateHeight : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductItem.updateHeight');
			
			if (this.options.theme === 'gallery')
				this.$el.css('height', this.$el.height() + 'px');
			
		}
		
		
	});
	
	return view;

});