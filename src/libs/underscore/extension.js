define([
    'underscore',
], function(_) {
	
	_.mixin({
		
		isDefined: function (value) {
			return !_.isUndefined(value);
		},
		
		
		isNotNull: function (value) {
			return !_.isNull(value);
		},
		
		
		isParseId: function (value) {
		
		return _.isString(value) && value.match(/^[A-Za-z0-9]{10}$/);
			
		},
		
		
		isParseAcl: function (value) {
			
			return value && (value instanceof Parse.ACL);
			
		},
		
		
		isParseObject: function (value) {
			
			return value && (value instanceof Parse.Object);
			
		},
		
		
		isParseRole: function (value) {
			
			return value && (value instanceof Parse.Role);
			
		},
		
		
		isParseUser: function (value) {
			
			return value && (value instanceof Parse.User);
			
		},
		
		
		bindModelToView : function (model, view, translate, options) {
			
			var
				translate	= translate || {},								// The list of functions for translating values
				attribute	= options && options.attribute || 'name',		// HTML attribute pointing to element
				restrict	= options && options.restrict || [],			// Processing only the specified keys
				defaultValue= options && options.defaultValue || null,		// Default value
				method		= options && options.method || 'val';			// The function to assign a value
				
			var
				types		= model._types;
			
			if (_.isArray(restrict) && !_.isEmpty(restrict))
				types = _.pick(types, restrict);
			
			_.each(
				types,
				function (type, key) {
					
					var $control = view.$('[' + attribute + '="' + key + '"]');
					
					if (_.has(translate, key)) {
						
						if (_.isFunction(translate[key]))
							translate[key](
								$control.size() > 0 ? $control : null,
								_.contains(['createdAt', 'updatedAt', 'id'], key) ? model[key] : model.get(key),
								model,
								view
							);
						
					} else {
						
						if ($control.size() === 1) {
							
							var
								modelValue			= _.contains(['createdAt', 'updatedAt', 'id'], key) ? model[key] : model.get(key),
								controlValue		= null,
								hasValue			= _.contains(['createdAt', 'updatedAt', 'id'], key) ? true : model.has(key);
							
							if (type.name === 'String')
								controlValue = hasValue ? String(modelValue) : null;
								
							else if (type.name === 'Number')
								controlValue = hasValue ? String(modelValue) : null;
								
							else if (type.name === 'Boolean')
								controlValue = hasValue ? String(modelValue) : null;
								
							else if (type.name === 'Date')
								controlValue = hasValue ? String(modelValue) : null;
								
							else if (type.name === 'Array')
								controlValue = hasValue ? String(modelValue) : null;
								
							else if (type.name === 'Object')
								controlValue = null;
							
							if (_.contains(['String', 'Number', 'Boolean', 'Date', 'Array', 'Object'], type.name))
								$control[method](hasValue ? controlValue : (defaultValue || null));
							
						}
						
					}
					
				}
			);
			
		},
		
		
		bindViewToModel : function (model, view, translate, options) {
			
			var
				translate	= translate || {},							// The list of functions for translating values
				attribute	= options && options.attribute || 'name',	// HTML attribute pointing to element
				restrict	= options && options.restrict || [],		// Processing only the specified keys
				method		= options && options.method || 'val',		// The function to assign a value
				strict		= options && options.strict || true;		// Strict value types
			
			var
				types = model._types;
			
			if (_.isArray(restrict) && !_.isEmpty(restrict))
				types = _.pick(types, restrict);
			
			_.each(
				types,
				function (type, key) {
					
					var $control = view.$('[' + attribute + '="' + key + '"]');
					
					if (_.has(translate, key)) {
						
						var modelValue =
						_.isFunction(translate[key])
						?
						translate[key](
							$control.size() > 0 ? $control : null,
							$control.size() === 1 ? $control[method]() : null,
							model,
							view,
							key,
							options
						)
						:
						translate[key];
						
						if (!_.isUndefined(modelValue)) {
							
							/*if (options.strict && !(modelValue instanceof type))
								console.error('bindFormToModel: unexpected value type for key "' + key + '".');
								//throw 'bindFormToModel: unexpected value type for key "' + key + '".';
							*/
							
							if (!_.isNull(modelValue))
								model.set(key, modelValue);
						
						} else if (model.has(key))
							model.unset(key);
						
					} else {
						
						if ($control.size() === 1 && _.contains(['String', 'Number', 'Boolean', 'Date', 'Array'], type.name)) {
							
							var
								controlValue		= $control[method](),
								modelValue			= undefined,
								hasValue			= undefined;
							
							if (type.name === 'String') {
								
								modelValue = new type(controlValue);
								hasValue = !_.isEmpty(modelValue);
								
							} else if (type.name === 'Number') {
								
								modelValue = new type(controlValue);
								hasValue = !_.isEmpty(controlValue) && _.isFinite(modelValue);
								
							} else if (type.name === 'Boolean') {

								if (controlValue === 'true')
									modelValue = true;
									
								else if (controlValue === 'false')
									modelValue = false;
								
								hasValue = _.isBoolean(modelValue);
								
							} else if (type.name === 'Date') {
								
								modelValue = new type(controlValue);
								hasValue = !_.isEmpty(controlValue);
								
							} else if (type.name === 'Array') {
								
								modelValue = controlValue.split(/,/);
								hasValue = !_.isEmpty(controlValue) && !_.isEmpty(modelValue);
								
							}
								
							if (hasValue === true && !_.isUndefined(modelValue)) {
								
								if (strict && !(modelValue instanceof type)) {
									console.error('bindFormToModel: unexpected value type for key "' + key + '".');
									console.error(modelValue);
									//throw 'bindFormToModel: unexpected value type for key "' + key + '".';
								}
								
								model.set(key, modelValue.valueOf());
								
							} else if (model.has(key))
								model.unset(key);
							
							
						}
						
					}
					
				}
			);
			
		},
		
		
		mapModel : function (context, values, keys) {
			
			if (_.isArray(keys))
				values = _.pick(values, keys);
			
			_.each(
				values,
				function (value, key) {
					
					var defaultValue = this._defaults[key];
					
					if (_.isString(defaultValue)) {
						
						if (_.isString(value) && !_.isEmpty(value))
							this.set(key, value);
						else if (!this.isNew() && this.has(key))
							this.unset(key);
						
					} else if (_.isNumber(defaultValue)) {
						
						if (!_.isUndefined(value) && !_.isNull(value) && value !== '' && !_.isNaN(Number(value)))
							this.set(key, Number(value));
						else if (!this.isNew() && this.has(key))
							this.unset(key);
						
					} else if (_.isArray(defaultValue)) {
						
						if (_.isArray(value) && !_.isEmpty(value))
							this.set(key, value);
						else if (!this.isNew() && this.has(key))
							this.unset(key);
						
					} else if (_.isNull(defaultValue)) {
						
						if (!_.isNull(value))
							this.set(key, value);
						else if (!this.isNew() && this.has(key))
							this.unset(key);
						
					}
					
				},
				context
			)
			
		},
		
		
		mapModelString : function (context, values, keys) {
			
			if (_.isArray(keys))
				values = _.pick(values, keys);
			
			_.each(
				values,
				function (value, key) {
					
					value = String(value);
					
					if (!_.isEmpty(value))
						this.set(key, String(value));
					else if (this.isNew() && this.has(key))
						this.unset(key);
					
				},
				context
			)
			
		},
		
		
		mapModelNumber : function (context, values, keys) {
			
			if (_.isArray(keys))
				values = _.pick(values, keys);
			
			_.each(
				values,
				function (value, key) {
					
					value = Number(value);
					
					if (_.isFinite(value))
						this.set(key, value);
					else if (this.isNew() && this.has(key))
						this.unset(key);
					
				},
				context
			)
			
		},
		
		
		fillWith : function (context, value) {
			
			var result = {};
			
			_.each(context, function (key) {
				
				result[key] = value;
				
			});
			
			return result;
			
		},
		
		
		increment : function (obj, context, value) {
			
			if (_.isUndefined(context))
				return;
			
			_.each(obj, function (key) {
				
				context[key] += value || 1;
				
			});
			
		},
		
		
		filterKeys : function (obj, comparator, converter) {
			
			return _
				.chain(obj)
				.map(
					function (value, key) {
						return comparator(value) ? (_.isFunction(converter) ? converter(key) : key) : null;
					}
				)
				.compact()
				.value();
			
		},
		
		
		toRange : function (obj, comparator) {
			
			var ranges = [];
			
			if (_.isEmpty(obj))
				return ranges;
		
			ranges.push(_.reduce(obj, function (memo, value) {
	  
				if (!_.isNull(memo)) {
						
					if (comparator(memo, value)) {
						
						memo.till = value;
						memo.items.push(value);
						memo.count++;
				
					} else {
						
						this.push(memo);
						memo = null;
						
					}
					
				}
				
				if (_.isNull(memo))
					memo = {from: value, till: value, items: [value], count: 1};
					
				return memo;
				
			}, null, ranges));
			
			return ranges;
			
		},
		
		
		shrinkRange : function (obj, before, after) {
			
			var result = _
				.chain(obj)
				.map(function (value) {
					
					value.items = value.items.slice(before || 0, after > 0 ? -1 * after : undefined);
					
					value.count = _.size(value.items);
					
					value.from = _.first(value.items);
					value.till = _.last(value.items);
					
					return value.count > 0 ? value : null;
					
				})
				.compact()
				.value();
			
			return result;
			
		}
		
	});
	
});