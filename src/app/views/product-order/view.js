define([
	'underscore',
	'moment',
	'numeral',
	'parse',
	
	'text!templates/product-order/view.html'
], function (
	_, moment, numeral, Parse,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.template = _.template(viewTemplate);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderView.render');
	
			this.$el.html(this.template());
			
			return this;
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderView.build');
			
			this.model = model;
			
			_.bindModelToView(
				this.model,
				this,
				{
					createdAt				: function ($control, value) {$control.html(moment.utc(value).format(DATETIME_FORMAT));},
					user					: function ($control, value) {$control.html(value instanceof Parse.Object ? value.format('_formatted') : '&mdash;');},
					node					: function ($control, value, model) {$control.html(model.format('_node') || '&mdash;');},
					shippingAddress			: function ($control, value) {$control.html(value instanceof Parse.Object ? value.format('_formatted') : '&mdash;');},
					paymentCard				: function ($control, value) {$control.html(value instanceof Parse.Object ? value.format('_formatted') : '&mdash;');},
					stylist					: function ($control, value) {$control.html(value instanceof Parse.Object ? value.get('name') : '&mdash;');},
					product					: function ($control, value) {$control.html(value instanceof Parse.Object ? value.get('name') : '&mdash;');},
					productSize				: function ($control, value) {$control.html(value instanceof Parse.Object ? value.get('name') : '&mdash;');},
					dateFrom				: function ($control, value) {$control.html(value instanceof Date ? moment.utc(value).format(DATE_FORMAT) : '&mdash;');},
					dateTill				: function ($control, value) {$control.html(value instanceof Date ? moment.utc(value).format(DATE_FORMAT) : '&mdash;');},
					productPrice			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					productDiscount			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					productTotal			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					taxPrice				: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					deliveryPrice			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					deliveryDiscount		: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					deliveryTotal			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					insurancePrice			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					insuranceDiscount		: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					insuranceTotal			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					totalPrice				: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					totalDiscount			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					totalBalance			: function ($control, value) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
					state					: function ($control, value, model) {$control.html(model.format('_state').join(', ') || '&mdash;');},
					discounts				: function ($control, value, model) {$control.html(model.format('_productDiscounts').join(', ') || '&mdash;');}
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