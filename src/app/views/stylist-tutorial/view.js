define([
    'underscore',
    'parse',
    
    'text!templates/stylist-tutorial/view.html',
    
    'mCustomScrollbar'
], function (
	_, Parse,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.template = _.template(viewTemplate);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialView.render');
	
			this.$el.html(this.template());
			
			if ($.fn.mCustomScrollbar)
				this.$('.mCustomScrollbar').mCustomScrollbar({
					autoHideScrollbar	: true,
					theme				: 'dark',
					set_height			: 200,
					advanced			: {
						updateOnContentResize: true
					}
				});
			
			return this;
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialView.build');
			
			this.model = model;
			
			_.bindModelToView(
				this.model,
				this,
				{
					published				: function ($control, value) {$control.html(value === true ? 'Yes' : 'No');}
				},
				{
					attribute	: 'data-name',
					method		: 'html',
					defaultValue: '&mdash;'
				}
			);
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		}
		
		
	});
	
	return view;

});