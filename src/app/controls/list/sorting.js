/*
SortingControl

collection	: Parse.Collection (required)	- Sorted collection
name		: String			 			- Storage key
value		: String						- Initial value
disabled	: Boolean						- Disable control
storage		: StorageManager				- StorageManager instance to hold values

*/

define([
    'jquery',
    'underscore',
    'parse',
    
    'text!./sorting/template.html'
], function(
	$, _, Parse,
	viewTemplate
) {
	
	var view = Parse.View.extend({

		tagName : 'tr',
	
		events : {
			'click [data-sort]'		: 'doChangeSort'
		},
		
		_fields : [],
		_attributes : [],
		
		_value : null,
		_default : null,
		_disabled : null,
		_ready : null,
		

		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.initialize');
			
			_.bindAll(this, 'render', 'value', 'def', 'reset', 'disable', 'enable', 'invalidate', 'ready', 'apply', 'doChangeSort');
			
			this.template = _.template(viewTemplate);
			
			this._ready = false;
			
			if (_.has(options, 'name') && _.isString(options.name) && !_.isEmpty(options.name))
				this.name = options.name;
			
			
			if (_.has(options, 'storage'))
				this.storage = options.storage;
			
			this._fields = [];
			
			if (_.isArray(options.fields)) {
				
				this._fields = options.fields;
				
				this._attributes = _
					.chain(options.fields)
					.map(
						
						function (field) {
							return field.attribute;
						}
					
					)
					.compact()
					.uniq()
					.value();
				
			} else
				throw 'fields must be array';
			
			if (this.name && this.storage && this.storage.has(this.name)) {
				
				var value = this.storage.get(this.name, '');
				
				if (value.match(/^([+-])(\w+)$/))
					this._value = value;

			} else 
				this._value = null;
			
			if (_.has(options, 'value') && _.isString(options.value) && options.value.match(/^([+-])(\w+)$/))
				this._default = options.value;
			
			else
				this._default = null;
			
		},
	
	
		render : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.render');
			
			var data = {
				fields		: this._fields,
				attributes	: this._attributes,
				value		: this.value()
			};
			
			this.$el.html(this.template(data));
	
			return this;
			
		},
		
		
		value : function (raw) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.value');
			
			if (raw === true)
				return this._value;
				
			var value = this._value || this._default || '';
			
			if (args = value.match(/^([+-])(\w+)$/)) {
				
				return { 
					attribute	: args[2],
					direction	: Number(args[1] + 1)
				};
				
			} else
				return null;
			
		},
		
		
		def : function (raw) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.def');
			
			if (raw === true)
				return this._default;
			
			var value = this._default || '';
			
			if (args = value.match(/^([+-])(\w+)$/)) {
				
				return { 
					attribute	: args[2],
					direction	: Number(args[1] + 1)
				};
				
			} else
				return null;
			
		},
		
		
		reset : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.reset');
	
			this._value = null;
			
			this.apply();
			
		},
		
		
		disable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.disable');
	
			this._disabled = true;
			
			this.invalidate();
			
		},
		
		
		enable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.enable');
			
			this._disabled = false;
			
			this.invalidate();
			
		},
		
		
		invalidate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.invalidate');
			
			this._ready = false;
			
			this.apply();
			
		},
		
		
		ready : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.ready' + ' - ' + String(this._ready));
			
			return this._ready;
			
		},
		
		
		apply : function (silent) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.apply');
			
			var value = this.value();
			
			if (value && value.direction === 1)
				this.collection.query.ascending(value.attribute);
			
			else if (value && value.direction === -1)
				this.collection.query.descending(value.attribute);
			
			if (this.name && this.storage) {
				
				var
					value = this.value(true)
					def = this.def(true);
				
				if (value && value !== def)
					this.storage.set(this.name, value);
				
				else
					this.storage.unset(this.name);
				
			}
			
			this._ready = true;
			
			if (silent !== true) {
				
				if (value)
					this.collection.trigger('sorting:' + value.attribute, 'sorting:' + value.attribute, this.collection, this, this._value);
				this.collection.trigger('sorting:*', 'sorting:*', this.collection, this, this._value);
			}
			
			this.render();
			
		},
	
	
		doChangeSort : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SortingControl.doChangeSort');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.sort && _.contains(this._attributes, data.sort)) {
				
				var
					value = this.value(),
					def = this.def();
				
				console.log(data.sort)
				console.log(value)
				
				if (value && value.attribute === data.sort) {
					
					if (def && def.attribute === value.attribute) {
						
						if (value.direction === -1)
							value.direction = 1;
						
						else
							value.direction = -1;
						
					} else {
						
						if (value.direction === -1)
							value = null;
							
						else if (value.direction === 1)
							value.direction = -1;
						
						else
							value.direction = 1;
						
					}
					
				} else {
					
					value = {
						attribute	: data.sort,
						direction	: 1
					};
					
				}
				
				if (value) {
					
					this._value = '';
					
					if (value.direction === -1)
						this._value += '-';
					
					else if (value.direction === 1)
						this._value += '+';
					
					this._value += value.attribute;
					
				} else
					this._value = null;
					
				console.log(value)
				
				this.apply();
				
			}
			
			return false;
			
		}
		
	});
	
	return view;
	
});