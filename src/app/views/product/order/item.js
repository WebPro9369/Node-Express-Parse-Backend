define([
    'underscore',
    'moment',
    'numeral',
    'parse',
    
    'entities/daterange',
    
    'text!templates/product/order/item.html'
], function(
	_, moment, numeral, Parse,
	DaterangeEntity,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {
			'click [data-action="product-order-state"]'			: 'doChangeState'
		},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.initialize');
			
			_.bindAll(this, 'render', 'doChangeState', 'makeChangeState');
			
			this.template = _.template(itemTemplate);
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.render');
			
			var data = this.model.toTemplate();
			data.totalRange = this.options.range;
			
			var range = new DaterangeEntity(this.model.get('dateFrom'), this.model.get('dateTill'));
			data.rentRange = range.range(true);
			data.fullRange = _.invoke(this.model.get('dateRange'), 'valueOf')
			
			this.$el.html(this.template(data));
			
			return this;
			
		},
		
		
		doChangeState : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.doChangeState');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.$('.dropdown-toggle').dropdown('toggle');
			
			app.view.prompt(
				null,
				'danger',
				'Mark order confirmation',
				'Are you sure you want to mark order as &laquo;' + ((state = _.findWhere(this.model.stateEnum, {id: data.value})) ? state.text : '') + '&raquo;?',
				{
					yes	: ['danger', 'Yes, I agree'],
					no	: ['primary', 'No, I do not agree']
				},
				this.makeChangeState,
				data
			);
			
			return false;
			
		},
		
		
		makeChangeState : function(result, data) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.makeChangeState');
			
			if (result === 'yes' && _.has(data, 'value')) {
				
				this.model.addUnique('state', data.value);
				this.model.save().then(
					
					function (result) {
						
						app.view.alert(
							null,
							'success',
							'',
							'Order state successfully changed',
							3000
						);
						
					},
					function (error) {
						
						app.view.alert(
							null,
							'danger',
							'Failure to change an order state',
							error.message,
							false
						);
						
					}
						
				);
				
			}
			
		}
		
		
	});
	
	return view;

});