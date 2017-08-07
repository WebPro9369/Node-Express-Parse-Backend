/*
SearchControl

collection	: Parse.Collection (required)	- Searched collection
name		: String			 			- Storage key
field		: String						- Searched field
value		: String						- Initial value
disabled	: Boolean						- Disable control
storage		: StorageManager				- StorageManager instance to hold values

*/

define([
    'jquery',
    'underscore',
    'parse',
    
    'text!./search/template.html'
], function(
	$, _, Parse,
	viewTemplate
) {
	
	var view = Parse.View.extend({

		events : {
			'keypress [name="query"]'		: 'doKeypressQuery',
			'change [name="query"]'			: 'doChangeQuery'
		},
		
		_value : null,
		_disabled : null,
		_ready : null,
		

		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SearchControl.initialize');
	
			_.bindAll(this, 'render', 'value', 'reset', 'disable', 'enable', 'invalidate', 'ready', 'apply', 'doKeypressQuery', 'doChangeQuery');
			
			this.template = _.template(viewTemplate);
			
			this._ready = false;
			
			if (_.has(options, 'name') && _.isString(options.name) && !_.isEmpty(options.name))
				this.name = options.name;
			
			if (_.has(options, 'field') && _.isString(options.field) && !_.isEmpty(options.field))
				this.field = options.field;
			
			if (_.has(options, 'placeholder') && _.isString(options.placeholder) && !_.isEmpty(options.placeholder))
				this.placeholder = options.placeholder;
			
			if (_.has(options, 'storage'))
				this.storage = options.storage;
			
			if (this.name && this.storage && this.storage.has(this.name))
				this._value = this.storage.get(this.name, '');
			
			else if (_.has(options, 'value') && _.isString(options.value) && !_.isEmpty(options.value))
				this._value = options.value;
				
			else
				this._value = '';
			
			this._disabled = options.disabled === true;
			
		},
	
	
		render : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SearchControl.render');
			
			var data = {
				value		: this._value,
				placeholder	: this.placeholder || 'Search ...'
			};
			
			this.$el.html(this.template(data));
			
			return this;
			
		},
		
		
		value : function (raw) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SearchControl.value');
			
			if (_.isEmpty(this._value))
				return null;
			
			if (raw === true)
				return this._value;
			
			var value = _
				.chain(String(this._value).split(/\b/))
				.map(
					function (word) {
						return word.toLowerCase();
					}
				)
				.filter(
					function(word) {
						return word.match(/^\w+$/);
					}
				)
				.value();
			
			return _.isEmpty(value) ? null : value;
			
		},
		
		
		reset : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.reset');
	
			this._value = '';
			
			this.apply();
			
		},
		
		
		disable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.disable');
	
			this._disabled = true;
			
			this.invalidate();
			
		},
		
		
		enable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.enable');
			
			this._disabled = false;
			
			this.invalidate();
			
		},
		
		
		invalidate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SearchControl.invalidate');
			
			this._ready = false;
			
			this.apply();
			
		},
		
		
		ready : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SearchControl.ready' + ' - ' + String(this._ready));
			
			return this._ready;
			
		},
		
		
		apply : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SearchControl.apply');
			
			if (this._disabled === true) {
				
				if (this.field)
					this.collection.query._removeConstraint(this.field, 'equalTo');
					
				else
					this.collection.query._removeConstraint('searchable', 'containedIn');
				
				if (this.name && this.storage)
					this.storage.unset(this.name);
				
			} else {
				
				if (this.field) {
					
					if (!_.isEmpty(this._value))
						this.collection.query.equalTo(this.field, this._value);
						
					else
						this.collection.query._removeConstraint(this.field, 'equalTo');
					
				} else {
					
					if (!_.isEmpty(this._value))
						this.collection.query.containedIn('searchable', this.value());
						
					else
						this.collection.query._removeConstraint('searchable', 'containedIn');
					
				}
				
				if (this.name && this.storage) {
					
					if (!_.isEmpty(this._value))
						this.storage.set(this.name, this._value);
					
					else
						this.storage.unset(this.name);
					
				}
				
			}
			
			this._ready = true;
			
			this.collection.trigger('search', 'search', this.collection, this, this._value);
			
		},
		
		
		doKeypressQuery : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SearchControl.doKeypressQuery');
			
			var
				$target = $(ev.currentTarget),
				value = $target.val();
			
			if (ev.which === 13) {
				
				ev.preventDefault();
				
				if (this._value === value)
					return false;
				
				this._value = value;
				
				this.apply();

				return false;
				
			}
			
		},
		
		
		doChangeQuery : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SearchControl.doChangeQuery');
			
			var
				$target = $(ev.currentTarget),
				value = $target.val();
				
			if (this._value === value)
				return false;
			
			this._value = value;
			
			this.apply();
			
			return false;
			
		}
		
	});
	
	return view;
	
});