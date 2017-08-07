define([
    'underscore',
    'moment',
    'numeral',
    'parse',
    
    'text!templates/stylist-order/item.html'
], function(
	_, moment, numeral, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {
			'click [data-action="stylist-order-state"]'			: 'doChangeState',
			'click [data-action="stylist-order-refund"]'		: 'doRefund'
		},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderItem.initialize');
			
			_.bindAll(this, 'render', 'doChangeState', 'makeChangeState', 'doRefund', 'makeRefund');
			
			this.template = _.template(itemTemplate);
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderItem.render');
			
			this.$el.html(this.template(this.model.toTemplate()));
			
			return this;
			
		},
		
		
		doChangeState : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderItem.doChangeState');
			
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
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderItem.makeChangeState');
			
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
			
		},
		
		
		doRefund : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderItem.doRefund');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			app.view.prompt(
				null,
				'danger',
				'Refund order confirmation',
				'Are you sure you want to refund order?',
				{
					yes	: ['danger', 'Yes, I agree'],
					no	: ['primary', 'No, I do not agree']
				},
				this.makeRefund,
				data
			);
			
			return false;
			
		},
		
		
		makeRefund : function(result, data) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderItem.makeRefund');
			
			if (result === 'yes' && _.has(data, 'id')) {
				
				var self = this;
				
				Parse.Cloud.run('stylistOrderRefund', {stylistOrder: data.id}).then(
					
					function (result) {
						
						if (self.model && self.model.collection)
							self.model.collection.fetch();
						
						app.view.alert(
							null,
							'success',
							'',
							'Order successfully refunded',
							3000
						);
						
					},
					function (error) {
						
						app.view.alert(
							null,
							'danger',
							'Failure to refund order',
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