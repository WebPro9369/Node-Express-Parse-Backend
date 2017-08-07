/*
DictinaryFilterControl

collection	: Parse.Collection (required)	- Filtered collection
name		: String (required) 			- Filtered attribute and storage key
Collection	: Parse.Collection (required)	- Datasource collection prototype
Model		: Parse.Object (required)		- Datasource model prototype
beforeFetch	: Function						- Before fetch callback with datasource query parameter
beforeAppply: Function						- The function called when changing values
disabled	: Boolean						- Disable control
storage		: StorageManager				- StorageManager instance to hold values

*/

define([
    'underscore',
    'parse',
    
    'select2'
], function(
	_, Parse
) {
	
	var view = Parse.View.extend({

		events : {
			'change'	: 'doChange'
		},
		
		_value : null,
		_disabled : null,
		_ready : null,
		
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.initialize');
			
			_.bindAll(this, 'value', 'reset', 'disable', 'enable', 'invalidate', 'ready', 'fetch', 'build', 'apply', 'doChange');
			
			this._ready = false;
			this._disabled = false;
			
			this.dictionary = null;
			
			if (options.name)
				this.name = options.name;
			else
				throw 'name is required';

			if (!(this.collection && (this.collection instanceof Parse.Collection)))
				throw 'collection must be instance of Parse.Collection';
				
			if (options.Collection && (options.Collection.prototype instanceof Parse.Collection))
				this.Collection = options.Collection
			else
				throw 'Collection must be instance of Parse.Object';
				
			if (options.Model && (options.Model.prototype instanceof Parse.Object))
				this.Model = options.Model;
			else
				throw 'Model must be instance of Parse.Object';
			
			this.storage = options.storage || null;
			this.nullable = options.nullable === false ? false : true;
				
			this.dictionary = new (options.Collection);
			this.dictionary.query = new Parse.Query(options.Model);
			
			if (this.storage && this.storage.has(this.name))
				this._value = this.storage.get(this.name, null);
			else
				this._value = null;
			
			this.dictionary.bind('reset', this.build);
			
		},
		

		value : function (raw) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.value ' + this.name);
			
			return raw === true ? this._value : this.dictionary.get(this._value);
			
		},
		
		
		reset : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.reset ' + this.name);
			
			this._value = null;
			
		},
		
		
		disable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.disable ' + this.name);
	
			this._disabled = true;
			
			this.invalidate();
			
		},
		
		
		enable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.enable ' + this.name);
			
			this._disabled = false;
			
			this.invalidate();
			
		},
		
		
		invalidate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.invalidate ' + this.name);
			
			this._ready = false;
			
			var self = this;
			
			this.fetch().then(
				
				function () {
					
					if (_.isNull(self._value) && self.nullable !== true && _.isEmpty(self.dictionary.size() > 0)) {
						
						var value = self.dictionary.first();
						
						self._value = value.id;
						
						self.$el.select2('val', self._value);
						
					}
					
					self.apply();
					
				}
				
			);
			
		},
		
		
		ready : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.ready ' + this.name + ' - ' + String(this._ready));
			
			return this._ready;
			
		},
		
		
		fetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.fetch ' + this.name);
			
			if (this._disabled)
				return Parse.Promise.as(this.dictionary.reset());
			
			else {
				
				if (this.options.beforeFetch && _.isFunction(this.options.beforeFetch))
					this.options.beforeFetch(this.dictionary.query);
				
				return this.dictionary.fetch();
			
			}
			
		},
		
		
		build : function (collection) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.build ' + this.name);
			
			this.$el.select2('val', this._value);
			
			this.$el.select2({
				data		: this.dictionary.toDatasource(),
				allowClear	: this.nullable
			});
			
			this.$el.select2('val', this._value);
			
		},
		
		
		apply : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.apply ' + this.name);
			
			if (this.storage) {
				
				if (this._value)
					this.storage.set(this.name, this._value);
				else
					this.storage.unset(this.name);
				
			}
			
			if (_.isFunction(this.options.beforeApply))
				this.options.beforeApply(this, this.collection.query, this._value && (model = this.dictionary.get(this._value)) ? model : undefined);
			
			else if (!this._disabled && this._value && (model = this.dictionary.get(this._value)))
				this.collection.query.equalTo(this.name, model);
			else
				this.collection.query._removeConstraint(this.name, 'equalTo');
			
			this._ready = true;
			
			this.collection.trigger('filter:' + this.name, 'filter:' + this.name, this.collection, this, this.name, this._value, this.dictionary.get(this._value));
			this.collection.trigger('filter:*', 'filter:*', this.collection, this, this.name, this._value, this.dictionary.get(this._value));
			
		},
		
		
		doChange : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictinaryFilterControl.doChange ' + this.name);
			
			this._value = ev.val || null;
			
			this.apply();
				
		}
		
		
	});
	
	return view;
	
});