define([
    'underscore',
    'parse',
    
    'entities/address',
    
    'text!templates/showroom/view.html'
], function (
	_, Parse,
	AddressEntity,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.template = _.template(viewTemplate);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomView.render');
	
			this.$el.html(this.template());
			
			return this;
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomView.build');
			
			this.model = model;
			
			_.bindModelToView(
				this.model,
				this,
				{
					address						: function ($control, value) {
						
						var value = new AddressEntity(value);
						
						$control.filter('[rel="streetLines"]').html(value.has('streetLines') ? value.get('streetLines').join("\n") : '&mdash;');
						$control.filter('[rel="city"]').html(value.get('city') || '&mdash;');
						$control.filter('[rel="stateOrProvinceCode"]').html(value.get('stateOrProvinceCode') || '&mdash;');
						$control.filter('[rel="postalCode"]').html(value.get('postalCode') || '&mdash;');
						$control.filter('[rel="countryCode"]').html(value.get('countryCode') || '&mdash;');
						
					},
					primary					: function ($control, value) {$control.html(value === true ? 'Yes' : 'No');},
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