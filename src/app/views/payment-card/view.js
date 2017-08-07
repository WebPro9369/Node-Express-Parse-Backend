define([
    'underscore',
    'parse',
    
    'text!templates/payment-card/view.html'
], function (
	_, Parse,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaymentCardView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.template = _.template(viewTemplate);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaymentCardView.render');
	
			this.$el.html(this.template());
			
			return this;
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaymentCardView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaymentCardView.build');
			
			this.model = model;
			
			_.bindModelToView(
				this.model,
				this,
				{
					removedAt				: function ($control, value, model) {if (model.get('removed') === true && value) $control.html('Payment card removed by user at ' + moment(value).format(DATETIME_FORMAT)).parent().show(); else $control.html('').parent().hide();}
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