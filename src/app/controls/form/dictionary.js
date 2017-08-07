/*
DictionaryFormControl

name		: String (required) 			- Assigned attribute
Collection	: Parse.Collection (required)	- Datasource collection prototype
Model		: Parse.Object (required)		- Datasource model prototype
multiple	: Boolean (default = false)		- True if you allow multiple selection
nullable	: Boolean (default = false)		- True if you allow clear selection
scalar		: Boolean (default = false)		- True for raw value assignment
beforeFetch	: Function						- Before fetch callback with datasource query parameter

*/

define([
	'underscore',
	'parse',
	
	'jquery-validation',
    'jquery-validation.defaults',
	'select2'
], function(
	_, Parse
) {
	
	var view = Parse.View.extend({

		events : {
			'change'	: 'doChange'
		},
		

		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.initialize');
			
			_.bindAll(this, 'assign', 'sync', 'value', 'get', 'set', 'unset', 'fetch', 'build', 'apply', 'doChange');
			
			this.dictionary = null;
			
			if (options.name)
				this.name = options.name;
				
			if (options.Collection && (options.Collection.prototype instanceof Parse.Collection))
				this.Collection = options.Collection
			else
				throw 'Collection must be instance of Parse.Collection';
				
			if (options.Model && (options.Model.prototype instanceof Parse.Object))
				this.Model = options.Model;
			else
				throw 'Model must be instance of Parse.Object';
				
			this.dictionary = new (this.Collection);
			this.dictionary.query = new Parse.Query(this.Model);
			
			this.multiple = options.multiple === true;
			this.nullable = options.nullable === true;
			this.scalar = options.scalar === true;
			
			this._value = this.multiple ? [] : null;
			
			this.dictionary.bind('reset', this.build);
			
			if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.bind('sync', this.sync);
	
		},
		
		
		assign : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.assign ' + this.name);
			
			if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.unbind('sync', this.sync);
			
			if (!((model instanceof Parse.Object) || (model instanceof Parse.User)))
				throw 'model must be instance of Parse.Object';
			
			this.model = model;
			
			this.model.bind('sync', this.sync);
			
			this.sync();
			
		},
		
		
		sync : function (manual) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.sync ' + this.name);
			
			if (this.name && this.model.has(this.name)) {
				
				if (this.multiple) {
					
					if (this.scalar !== true)
						this.set(_.map(this.model.get(this.name), function (item) {return item.id}));
				
					else
						this.set(this.model.get(this.name));
					
				} else {
					
					if (this.scalar !== true)
						this.set(this.model.get(this.name).id);
					
					else
						this.set(this.model.get(this.name));
					
				}
				
			} else if (manual !== true)
				this.unset();
			
			this.$el.select2('val', this._value);
			
			if (this.$el && this.$el.valid && _.isFunction(this.$el.valid))
				this.$el.valid();
			
		},
		
		
		value : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.value ' + this.name);
			
			if (this.multiple) {
				
				if (this.scalar !== true) 
					
					return _
						.chain(this._value)
						.map(
							function (id) {
								return ((model = this.get(id)) && (model instanceof Parse.Object)) ? model : null;
							},
							this.dictionary
						)
						.compact()
						.value();
					
				else
					return this._value;
				
			} else {
			
				if (this.scalar !== true && (model = this.dictionary.get(this._value)))
					return model;
				
				else if (this.scalar === true)
					 return this._value;
						
				else
					return null;
			
			}
			
		},
		
		
		get : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.get ' + this.name);
			
			return this._value;
			
		},
		
		
		set : function (value) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.set ' + this.name);
			
			if (this.multiple) {
				
				var changed = !_.isEqual(_.sortBy(this._value), _.sortBy(value));
			
				this._value = value;
				
				if (changed)
					this.trigger('change', this);
				
			} else {
				
				var changed = this._value !== value;
			
				this._value = value;
				
				if (changed)
					this.trigger('change', this);
				
			}
			
		},
		
		
		unset : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.unset ' + this.name);
			
			if (this.multiple) {
				
				var changed = !_.isEmpty(this._value);
				
				this._value = [];
				
				if (changed)
					this.trigger('change', this);
			
			} else {
				
				var changed = this._value !== null;
				
				this._value = null;
				
				if (changed)
					this.trigger('change', this);
			}
			
		},
		
		
		fetch : function(datasource) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.fetch ' + this.name);
			
			if (datasource) {
				
				this.dictionary.reset(datasource);
				
			} else {
			
				if (this.options.beforeFetch && _.isFunction(this.options.beforeFetch))
					this.options.beforeFetch(this.dictionary.query);
				
				return this.dictionary.fetch();
			
			}
			
		},
		
		
		build : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.build ' + this.name);
			
			var params = {
				data		: this.dictionary.toDatasource(),
				multiple	: this.multiple,
				allowClear	: this.nullable
			};
			
			this.$el.select2(params).attr('title', '');
			
			this.$el.select2('val', this._value);
			
			if (this.$el && this.$el.valid && _.isFunction(this.$el.valid))
				this.$el.valid();
			
		},
		
		
		apply : function(refresh) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.apply ' + this.name);
			
			if (this.options.beforeApply && _.isFunction(this.options.beforeApply))
				this.options.beforeApply(this, this.model, this._value);
			
			else if (this.name) {
				
				if (this.multiple) {
					
					if (this.scalar !== true) {
						
						var value = _
							.chain(this._value)
							.map(
								function (id) {
									return ((model = this.get(id)) && (model instanceof Parse.Object)) ? model : null;
								},
								this.dictionary
							)
							.compact()
							.value();
						
						var before = _.map(this.model.get(this.name), function (item) {return item.id;});
						var after = _.map(value, function (item) {return item.id;});
						
						if (!_.isEmpty(after)) {
						
							if (!_.isEqual(_.sortBy(before), _.sortBy(after)))
								this.model.set(this.name, value);
						
						} else if (this.model.has(this.name))
							this.model.unset(this.name);
						
					} else {
						
						var value = this._value;
						
						if (!_.isEmpty(value)) {
						
							if (!_.isEqual(_.sortBy(value), _.sortBy(this.model.get(this.name))))
								this.model.set(this.name, value);
						
						} else if (this.model.has(this.name))
							this.model.unset(this.name);
						
					}
					
				} else {
				
					if (this.scalar !== true && (model = this.dictionary.get(this._value))) {
						
						if (!this.model.has(this.name) || this.model.get(this.name).id !== model.id)
							this.model.set(this.name, model);
					
					} else if (this.scalar === true && (value = this._value)) {
						
						if (!this.model.has(this.name) || this.model.get(this.name) !== value)
							this.model.set(this.name, value);
							
					} else if (this.model.has(this.name))
						this.model.unset(this.name);
				
				}
			
			}
				
			return Parse.Promise.as();
					
		},
		
		
		doChange : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DictionaryFormControl.doChange ' + this.name);
			
			var
				$target = $(ev.currentTarget),
				data = $target.select2('data');
			
			if (this.multiple) {
				
				if (data && !_.isEmpty(data))
					this.set(_.map(data, function (item) {return item.id;}));
	
				else
					this.unset();
				
				
			} else {
				
				if (data && data.id)
					this.set(data.id);
	
				else
					this.unset();
				
			}
			
			if (this.$el && this.$el.valid && _.isFunction(this.$el.valid))
				this.$el.valid();
			
		}
		
		
	});
	
	return view;
	
});