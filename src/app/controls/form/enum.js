/*
EnumFormControl

name		: String (required) 			- Assigned attribute
datasource	: Array (required)				- Datasource array with items which should have id and text attributes
multiple	: Boolean (default = false)		- True if you allow multiple selection
nullable	: Boolean (default = false)		- True if you allow clear selection

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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.initialize');
			
			_.bindAll(this, 'assign', 'sync', 'get', 'set', 'unset', 'fetch', 'build', 'apply', 'doChange');
			
			if (options.name)
				this.name = options.name;
				
			if (options.datasource && _.isArray(options.datasource))
				this.datasource = options.datasource;
			else
				throw 'Enum is empty';
				
			this.multiple = options.multiple === true;
			this.nullable = options.nullable === true;
			
			this._value = this.multiple ? [] : null;
			
			if (this.model instanceof Parse.Object)
				this.model.bind('sync', this.sync);
			
		},
		
		
		assign : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.assign ' + this.name);
			
			if (this.model instanceof Parse.Object)
				this.model.unbind('sync', this.sync);
			
			if (!(model instanceof Parse.Object))
				throw 'model must be instance of Parse.Object';
			
			this.model = model;
			
			this.model.bind('sync', this.sync);
			
			this.sync();
			
		},
		
		
		sync : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.sync ' + this.name);
			
			if (this.options.beforeSync && _.isFunction(this.options.beforeSync))
				this.set(this.options.beforeSync(this, this.model));
				
			else if (this.name && this.model.has(this.name))
				this.set(this.model.get(this.name));
				
			else
				this.unset();
			
			this.$el.select2('val', this._value);
			
			if (this.$el && this.$el.valid && _.isFunction(this.$el.valid))
				this.$el.valid();
			
		},
		
		
		get : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.get ' + this.name);
			
			return this._value;
			
		},
		
		
		set : function (value) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.set ' + this.name);
			
			var changed = this.multiple ? !_.isEqual(_.sortBy(this._value), _.sortBy(value)) : this._value !== value;
			
			this._value = value;
			
			if (changed)
				this.trigger('change', this);
			
		},
		
		
		unset : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.unset ' + this.name);
			
			var changed = this.multiple ? !_.isEmpty(this._value) : this._value !== null;
			
			this._value = this.multiple ? [] : null;
			
			if (changed)
				this.trigger('change', this);
			
		},
		
		
		fetch : function(datasource) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.fetch ' + this.name);
			
			if (datasource)
				this.datasource = datasource;
			
			return Parse.Promise.as(this.build());
			
		},
		
		
		build : function (collection) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.build ' + this.name);
			
			var params = {
				data		: this.datasource,
				multiple	: this.multiple,
				allowClear	: this.nullable
			};
			
			this.$el.select2(params).attr('title', '');
			
			this.$el.select2('val', this._value);
			
			if (this.$el && this.$el.valid && _.isFunction(this.$el.valid))
				this.$el.valid();
			
		},
		
		
		apply : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.apply ' + this.name);
			
			if (this.options.beforeApply && _.isFunction(this.options.beforeApply))
				this.options.beforeApply(this, this.model, this._value);
			
			else if (this.name) {
				
				if (this.multiple && !_.isEmpty(this._value)) {
					
					if (!_.isEqual(_.sortBy(this.model.get(this.name)), _.sortBy(this._value)))
						this.model.set(this.name, this._value);
				
				} else if (!this.multiple && !_.isUndefined(this._value) && !_.isNull(this._value) && !_.isNaN(this._value)) {
				
					if (!this.model.has(this.name) || this.model.get(this.name) !== this._value)
						this.model.set(this.name, this._value);
					
				} else if (this.model.has(this.name))
					this.model.unset(this.name);
				
			}
				
			return Parse.Promise.as();
					
		},
		
		
		doChange : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('EnumFormControl.doChange ' + this.name);
			
			var
				$target = $(ev.currentTarget),
				data = $target.select2('data');
			
			if (this.multiple) {
			
				var value = _.map(data, function (value) {return value.id;});
				
				if (!_.isEmpty(value))
					this.set(value);
				
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