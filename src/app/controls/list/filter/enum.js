/*
EnumFilterControl

collection	: Parse.Collection (required)	- Filtered collection
name		: String (required) 			- Filtered attribute and storage key
datasource	: Array (required)				- Datasource array with items which should have id and text attributes
type		: String (default = 'String')	- Value data type
disabled	: Boolean						- Disable control
storage		: StorageManager				- StorageManager instance to hold values
beforeAppply: Function						- The function called when changing values

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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.initialize');
			
			_.bindAll(this, 'value', 'reset', 'invalidate', 'ready', 'fetch', 'build', 'apply', 'doChange');
			
			this._ready = false;
			
			if (options.name)
				this.name = options.name;
			else
				throw 'name is required';
				
			if (!(this.collection && (this.collection instanceof Parse.Collection)))
				throw 'collection must be instance of Parse.Collection';
				
			if (options.datasource && _.isArray(options.datasource))
				this.datasource = options.datasource;
			else
				throw 'datasource is empty';
				
			this.type = options.type || 'String';
			this.storage = options.storage || null;
			this.nullable = options.nullable === false ? false : true;
			
			if (this.storage && this.storage.has(this.name)) {
				
				var value = this.storage.get(this.name, '');
				
				if (this.type === 'Boolean') {
					
					if (value.match(/^true$/i)) this._value = true;
					else if (value.match(/^false$/i)) this._value = false;
					
				} else if (this.type === 'Number')
					this._value = parseFloat(value);
					
				else if (this.type === 'String')
					this._value = String(value);
					
				else
					this._value = null; 
				
			} else
				this._value = null;
			
		},
		
		
		value : function (complex) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.value ' + this.name);
			
			if (complex === true)
				return _.findWhere(this.datasource, {id: this._value})
				
			else
				return this._value;
			
		},
		
		
		reset : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.reset ' + this.name);
			
			this._value = null;
			
		},
		
		
		invalidate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.invalidate ' + this.name);
			
			this._ready = false;
			
			var self = this;
			
			this.fetch().then(
				
				function () {
					
					if (_.isNull(self._value) && self.nullable !== true && !_.isEmpty(self.datasource)) {
						
						var value = _.first(self.datasource);
						
						self._value = value.id;
						
						self.$el.select2('val', String(self._value));
						
					}
					
					self.apply();
					
				}
				
			);
			
		},
		
		
		ready : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.ready ' + this.name + ' - ' + String(this._ready));
			
			return this._ready;
			
		},
		
		
		fetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.fetch ' + this.name);
			
			return Parse.Promise.as(this.build());
			
		},
		
		
		build : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.build ' + this.name);
			
			var params = {
				data		: this.datasource,
				allowClear	: this.nullable
			};
			
			this.$el.select2(params);
			
			this.$el.select2('val', String(this._value));
			
		},
		
		
		apply : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.apply ' + this.name);
			
			if (this.storage) {
				
				if (!_.isNull(this._value))
					this.storage.set(this.name, String(this._value));
				else
					this.storage.unset(this.name);
				
			}
			
			if (_.isFunction(this.options.beforeApply))
				this.options.beforeApply(this, this.collection.query, this._value);
			
			else if (!_.isNull(this._value))
				this.collection.query.equalTo(this.name, this._value);
			else
				this.collection.query._removeConstraint(this.name, 'equalTo');
				
			this._ready = true;

			this.collection.trigger('filter:' + this.name, 'filter:' + this.name, this.collection, this, this.name, this._value);
			this.collection.trigger('filter:*', 'filter:*', this.collection, this, this.name, this._value);
			
		},
		
		
		doChange : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFilterControl.doChange ' + this.name);
			
			var
				$target = $(ev.currentTarget),
				data = $target.select2('data');
			
			this._value = data && _.has(data, 'id') ? data.id : null;
			
			this.apply();
				
		}
		
		
	});
	
	return view;
	
});