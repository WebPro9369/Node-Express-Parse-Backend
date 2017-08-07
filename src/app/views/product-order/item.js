define([
    'underscore',
    'moment',
    'numeral',
    'parse',
    
    'text!templates/product-order/item.html'
], function(
	_, moment, numeral, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {
			'click [data-action="product-order-state"]'			: 'doChangeState',
			'click [data-action="product-order-refund"]'		: 'doRefund',
			'click [data-action="product-order-remove"]'		: 'doRemove'
		},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.initialize');
			
			_.bindAll(this, 'render', 'doChangeState', 'makeChangeState', 'doRefund', 'makeRefund', 'doRemove', 'makeRemove');
			
			this.template = _.template(itemTemplate);
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.render');
			
			this.$el.html(this.template(this.model.toTemplate()));
			
			if (this.options.theme === 'gallery')
				this.$el.addClass('col-md-3 table-item');
			
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
			
		},
		
		
		doRefund : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.doRefund');
			
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
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.makeRefund');
			
			if (result === 'yes' && _.has(data, 'id')) {
				
				var self = this;
				
				Parse.Cloud.run('productOrderRefund', {productOrder: data.id}).then(
					
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
			
		},
		
		
		doRemove : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.doRemove');
			
			app.view.prompt(
				null,
				'danger',
				'Remove order confirmation',
				'Are you sure you want to remove order',
				{
					yes	: ['danger', 'Yes, I agree'],
					no	: ['primary', 'No, I do not agree']
				},
				this.makeRemove
			);
			
			return false;
			
		},
		
		
		makeRemove : function(result, data) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderItem.makeRemove');
			
			if (result === 'yes') {
				
				var self = this;
				
				this.model.destroy().then(
					
					function (result) {
						
						app.view.alert(
							null,
							'success',
							'',
							'Order successfully removed',
							3000
						);
						
						self.remove();
						
					},
					function (error) {
						
						app.view.alert(
							null,
							'danger',
							'Failure to remove an order',
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