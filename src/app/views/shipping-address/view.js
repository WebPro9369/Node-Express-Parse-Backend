define([
    'underscore',
    'parse',
    
    'entities/address',
    
    'text!templates/shipping-address/view.html',
    
    'mCustomScrollbar'
], function (
	_, Parse,
	AddressEntity,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShippingAddressView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.template = _.template(viewTemplate);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShippingAddressView.render');
	
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShippingAddressView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShippingAddressView.build');
			
			this.model = model;
			
			_.bindModelToView(
				this.model,
				this,
				{
					value						: function ($control, value) {
						
						var value = new AddressEntity(value);
						
						$control.filter('[rel="streetLines"]').html(value.has('streetLines') ? value.get('streetLines').join("\n") : '&mdash;');
						$control.filter('[rel="city"]').html(value.get('city') || '&mdash;');
						$control.filter('[rel="stateOrProvinceCode"]').html(value.get('stateOrProvinceCode') || '&mdash;');
						$control.filter('[rel="postalCode"]').html(value.get('postalCode') || '&mdash;');
						$control.filter('[rel="countryCode"]').html(value.get('countryCode') || '&mdash;');
						
					},
					removedAt					: function ($control, value, model) {if (model.get('removed') === true && value) $control.html('Shipping address removed by user at ' + moment(value).format(DATETIME_FORMAT)).parent().show(); else $control.html('').parent().hide();}
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