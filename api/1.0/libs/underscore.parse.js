var _ = require('underscore');

////////////////////////////////////////////////////////////////////////////////
// Underscore extension

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
	
	requestParamExists : function (request, name, type) {
		
		if (!_.has(request.params, name))
			return false;
			
		var value = request.params[name];
		
		if (_.isUndefined(value))
			return false;
		
		if (_.isDate(value))
			return true;
		
		if (_.isArray(value) && !_.isEmpty(value))
			return true;
		
		if (_.isObject(value) && !_.isEmpty(value))
			return true;
			
		if (_.isString(value) && !_.isEmpty(value))
			return true;
		
		if (_.isNumber(value) && _.isFinite(value))
			return true;
		
		if (_.isBoolean(value))
			return true;
		
		return false;
		
	},
	
	requestMatch : function (request, name, type) {
		
		if (!_.has(request, name))
			return false;
			
		var value = request[name];
		
		if (_.isUndefined(value))
			return false;
		
		if (_.isString(type) && !_.isEmpty(type)) {
			
			if (type === 'Id')
				return _.isParseId(value);
			
			else if (type === 'Date')
				return _.isDate(value);
				
			else if (type === 'Array')
				return _.isArray(value) && !_.isEmpty(value);
				
			else if (type === 'Object')
				return _.isObject(value) && !_.isEmpty(value);
				
			else if (type === 'String')
				return _.isString(value) && !_.isEmpty(value);
				
			else if (type === 'Number')
				return _.isNumber(value) && _.isFinite(value);
				
			else if (type === 'Boolean')
				return _.isBoolean(value);
			
		} else {
		
			if (_.isDate(value))
				return true;
			
			if (_.isArray(value) && !_.isEmpty(value))
				return true;
			
			if (_.isObject(value) && !_.isEmpty(value))
				return true;
				
			if (_.isString(value) && !_.isEmpty(value))
				return true;
			
			if (_.isNumber(value) && _.isFinite(value))
				return true;
			
			if (_.isBoolean(value))
				return true;
				
		}
		
		return false;
		
	},
	
	paramId: function (params, name) {
		return _.has(params, name) && (value = params[name]) && _.isString(value) && value.match(/^[A-Za-z0-9]{10}$/) ? value : false;
	},
	
	mapObject : function(obj, iterator, context) {
		var keys = _.keys(obj), length = keys.length, results = {}, currentKey;
		for (var index = 0; index < length; index++) {
			currentKey = keys[index];
			results[currentKey] = iterator.call(context, obj[currentKey], currentKey, obj);
		}
		return results;
	},
	
	mapAttributes: function (item, attributes) {
		
		var res = {};
		
		_.each(attributes, function (encoder, name) {
			
			if (_.contains(['id', 'createdAt'], name))
				return res[name] = this[name];
			
			if (!this.has(name))
				return;
			
			var value = this.get(name);
			
			if (_.isFunction(encoder)) 
				value = encoder(value, name, item);
			
			if (!_.isUndefined(value))
				res[name] = value;
			
		}, item);
		
		return res;
		
	},
	
	validateObject: function (context, required, restricted) {
		
		var hasRequired = _
			.chain(required)
			.map(
				function (key) {
					if (!this.has(key))
						return key + ' is required';
				},
				context
			)
			.compact()
			.value();
							
		var hasRestricted = _
			.chain(restricted)
			.map(
				function (key) {
					if (this.dirty(key) && this.has(key))
						return key + ' is restricted';
				},
				context
			)
			.compact()
			.value();
		
		return _
			.chain(
				_.union(hasRequired, hasRestricted)
			)
			.compact()
			.first()
			.value();
		
	},
	
	reIndex : function (context, attrs, dependent) {
		
		var stopWords = ['the', 'in', 'and', 'by', 'to', 'for'];
		
		var directIndex = _
			.chain(attrs)
			.map(
				function (name) {
					
					if (!this.has(name))
						return [];
					
					if (this.get(name) instanceof Parse.Object)
					
						return this.get(name).has('searchable') ? this.get(name).get('searchable') : [];
						
					else {
						
						var words = '';
						
						if (_.isObject(this.get(name)))
							words = _.map(this.get(name), function (value) {return _.isString(value) || _.isNumber(value) ? String(value) : '';}).join(' ');
						
						else if (_.isString(this.get(name)))
							words = String(this.get(name));
						
						else if (_.isNumber(this.get(name)))
							words = String(this.get(name));
						
						else if (_.isArray(this.get(name)))
							words = String(this.get(name));
							
						return _
							.chain(words.split(/\b/))
							.map(toLowerCase)
							.filter(
								function(word) {
									return word.match(/^\w+$/) && !_.contains(stopWords, word);
								}
							)
							.value();
						
					}
					
				},
				context
			)
			.flatten()
			.value();
				
		var dependentIndex = _
			.chain(dependent)
			.map(
				function (item) {
					return (item instanceof Parse.Object) && item.has('searchable') ? item.get('searchable') : [];
				}
			)
			.flatten()
			.value();
		
		return _.union(directIndex, dependentIndex);
		
	},
	
	fetchDependentReIndex : function (context, attrs) {
		
		return _.chain(attrs)
				.map(
					function (name) {
						
						return
							this.has(name) && (this.get(name) instanceof Parse.Object)
							?
							this.get(name).fetch().then(
								null,
								function (error) {
									return Parse.Promise.as(null);
								}
							)
							:
							Parse.Promise.as(null);
						
					},
					context
				)
				.value();
				
	},
	
	checkReIndex : function (context, attrs) {
		
		return _.chain(attrs)
				.map(
					function (name) {
						
						return this.dirty(name);
						
					},
					context
				)
				.compact()
				.size()
				.value() > 0;
		
	},
	
	bindDefaults : function (context, defaults) {
		
		return _.chain(defaults)
				.map(
					function (value, key) {
						
						if (!this.dirty(key)) {
							
							this.set(key, value);
							return key;
							 
						}
						
					},
					context
				)
				.value();
		
	},
	
	
	parseQueryInclude : function (context, defaults, available) {
		
		var include = _.isArray(defaults) && !_.isEmpty(defaults) ? defaults : [];
		
		if (_.isArray(context) && !_.isEmpty(context))
			include = _.union(include, context);
		
		else if (_.isString(context) && !_.isEmpty(context))
			include = _.union(include, [context]);
		
		return _.isArray(available) && !_.isEmpty(available) ? _.intersection(available, include) : include;
		
	},
	
	
	equal : function (left, right) {
		
		return _.isEqual(_.sortBy(left || [], repeater),_.sortBy(right || [], repeater));
		
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
		
	},
	
	
	firstError : function (error) {
		
		return _.chain(error).compact().first().value()
		
	}

	
});


function toLowerCase(word) {
	return word.toLowerCase();
}

function repeater(value) {
	return value;
}
