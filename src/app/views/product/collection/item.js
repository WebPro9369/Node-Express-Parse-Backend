define([
    'underscore',
    'parse',
    
    'text!templates/product/size/item.html'
], function(
	_, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {
			'change [name="product-size-title"]'				: 'doChangeTitle',
			'change [name="product-size-quantity"]'				: 'doChangeQuantity',
			'click [data-action="product-size-remove"]'			: 'doRemove'
		},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeItem.initialize');
			
			_.bindAll(this, 'render', 'doChangeTitle', 'doChangeQuantity', 'doUpdateTitle', 'doRemove');
			
			this.template = _.template(itemTemplate);
			
			this.type = options.type === 'form' ? 'form' : 'view'; 
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeItem.render');
			
			this.$el.html(this.template(this.model.toTemplate()));
			
			this.$el.attr('data-id', this.model.cid);
			
			return this;
			
		},
		
		
		doChangeTitle : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeItem.doChangeTitle');
			
			var
				$target = $(ev.currentTarget),
				value = $target.val()
			
			this.model.set('name', value);
			
			this.model.collection.trigger('update', this.model);
			
		},
		
		
		doChangeQuantity : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeItem.doChangeQuantity');
			
			var
				$target = $(ev.currentTarget),
				value = parseInt($target.val())
			
			if (_.isFinite(value))
				this.model.set('quantity', value);
			else
				this.model.unset('quantity');
			
			this.model.collection.trigger('update', this.model);
			
		},
		
		
		doUpdateTitle : function (response, value) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeItem.doUpdateTitle');
			
			this.model.set('name', value);
			
		},
		
		
		doRemove : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeItem.doRemove');
			
			if (this.type === 'form') {
				this.model.collection.remove(this.model);
				this.remove();
			}
			
			return false;
			
		}
		
		
	});
	
	return view;

});