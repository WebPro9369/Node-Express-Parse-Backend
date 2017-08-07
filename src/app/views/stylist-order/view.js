define([
	'underscore',
	'moment',
	'numeral',
	'parse',
	
	'entities/address',
	
	'text!templates/stylist-order/view.html'
], function (
	_, moment, numeral, Parse,
	AddressEntity,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.template = _.template(viewTemplate);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderView.render');
	
			this.$el.html(this.template());
			
			return this;
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderView.build');
			
			this.model = model;
			
			_.bindModelToView(
				this.model,
				this,
				{
					createdAt				: function ($control, value) {$control.html(moment.utc(value).format(DATETIME_FORMAT));},
					user					: function ($control, value) {$control.html(value instanceof Parse.Object ? value.format('_formatted') : '&mdash;');},
					shippingAddress			: function ($control, value) {$control.html(value instanceof Parse.Object ? value.format('_formatted') : '&mdash;');},
					showroom				: function ($control, value) {
						
						if ((value instanceof Parse.Object) && value.has('address')) {
							
							var address = new AddressEntity(value.get('address'));
							
							$control.html((value.get('name') || '') + address.format());
							
						} else
							$control.html('&mdash;');
						
					},
					paymentCard				: function ($control, value) {$control.html(value instanceof Parse.Object ? value.format('_formatted') : '&mdash;');},
					stylist					: function ($control, value) {$control.html(value instanceof Parse.Object ? value.get('fullName') : '&mdash;');},
					orderDate				: function ($control, value) {$control.html(moment.utc(value).format(DATE_FORMAT));},
					orderTime				: function ($control, value, model) {$control.html(model.format('_orderTime').join(', ') || '&mdash;');},
					totalPrice				: function ($control, value) {$control.html(numeral(value).format(MONEY_FORMAT));},
					state					: function ($control, value, model) {$control.html(model.format('_state').join(', ') || '&mdash;');}
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