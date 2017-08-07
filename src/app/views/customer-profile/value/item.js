define([
    'underscore',
    'parse',
    
    'text!templates/customer-profile/value/item.html'
], function(
	_, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {
			'change [name="customer-profile-value"]'						: 'doChangeValue',
			'change [name="customer-profile-description"]'					: 'doChangeDescription',
			'click [data-action="customer-profile-value-remove"]'			: 'doRemove'
		},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueItem.initialize');
			
			_.bindAll(this, 'render', 'doChangeValue', 'doChangeDescription', 'doRemove');
			
			this.template = _.template(itemTemplate);
			
			this.type = options.type === 'form' ? 'form' : 'view'; 
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueItem.render');
			
			this.$el.html(this.template(_.defaults(this.model.toTemplate(), {value: '', description: ''})));
			
			this.$el.attr('data-id', this.model.cid);
			
			return this;
			
		},
		
		
		doChangeValue : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueItem.doChangeValue');
			
			var
				$target = $(ev.currentTarget),
				value = $target.val()
			
			if (!_.isEmpty(value))
				this.model.set('value', value);
			
			else
				this.model.unset('value');
			
			this.model.collection.trigger('update', this.model);
			
		},
		
		
		doChangeDescription : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueItem.doChangeDescription');
			
			var
				$target = $(ev.currentTarget),
				value = $target.val()
			
			if (!_.isEmpty(value))
				this.model.set('description', value);
				
			else
				this.model.unset('description');
				
			this.model.collection.trigger('update', this.model);
			
		},
		
		
		doRemove : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueItem.doRemove');
			
			if (this.type === 'form') {
				this.model.collection.remove(this.model);
				this.remove();
			}
			
			return false;
			
		}
		
		
	});
	
	return view;

});