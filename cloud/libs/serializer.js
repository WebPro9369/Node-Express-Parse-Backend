// Serializer

var _ = require('underscore');

(function(_) {
	
	
	function Serializer(encoders) {
		
		this._encoders = encoders;
		
	}
	
	
	Serializer.prototype.iterateArray = function (items, iterator) {
		
		//console.log('iterateArray', items, iterator);
		
		var res = _
			.chain(items)
			.map(
				function (item) {
					
					if (_.isFunction(iterator))
						return iterator(item);
					
					else if (iterator === true)
						return item;
						
					else
						return this.iterateObject(item, iterator);
					
				},
				this
			)
			.compact()
			.value();
		
		if (!_.isEmpty(res))
			return res; 
		
	}
	
	
	Serializer.prototype.iterateObject = function (item, iterator) {
		
		//console.log('iterateObject', item, iterator);
		
		if (_.isObject(iterator) && !_.isEmpty(iterator)) {
			
			var res = {};
		
			_.each(iterator, function (type, name) {
				
				var value, encoder;
				
				if (_.isString(type) && _.has(this._encoders, type))
					encoder = this._encoders[type];
					
				else if (_.isFunction(type))
					encoder = type;
				
				else if (type === true)
					encoder = type;
				
				if (_.contains(['id', 'createdAt', 'createdAt'], name))
					value = item[name];
				
				else if (name.match(/^_/) && _.isFunction(encoder))
					value = item;
				
				else if (item.has(name))
					value = item.get(name);
				
				if (_.isUndefined(value))
					return;
				
				if (_.isArray(value))
					value = this.iterateArray(value, encoder);
					
				else if (!_.isUndefined(value))
					value = this.iterateObject(value, encoder);
				
				if (!_.isUndefined(value))
					res[name] = value;
				
			}, this);
			
			if (!_.isEmpty(res))
				return res;
		
		} else if (_.isFunction(iterator))
			return iterator(item, this);
		
		else if (iterator === true)
			return item;
		
	}
	
	
	Serializer.prototype.flatten = function (obj, parent, res) {
		
		if (!((_.isArray(obj) || _.isObject(obj)) && !_.isEmpty(obj)))
			return;
		
		_.each(
			obj,
			function (value, key) {
				
				var path = parent + (_.isEmpty(parent) ? '' : '_') + key;
				
				if ((_.isArray(value) || _.isObject(value)) && !_.isEmpty(value))
					this.flatten(value, path, res);
					
				else
					res[path] = value;
			},
			this
		);
		
	}
	

	Serializer.prototype.serialize = function (value, type, flatten) {
		
		var encoder;
		
		if (_.isString(type) && _.has(this._encoders, type))
			encoder = this._encoders[type];
		
		else if (_.isFunction(type))
			encoder = type;
		
		else if (type === true)
			encoder = type;
		
		if (!encoder)
			return;
		
		var res;
		
		if (_.isArray(value))
			res = this.iterateArray(value, encoder);
		
		else
			res = this.iterateObject(value, encoder);
		
		if (flatten === true) {
			
			var flattened = {};
			
			this.flatten(res, '', flattened);
			
			return flattened;
			
		} else
			return res;
			
	}
	
	module.exports = Serializer;
	 
} (_));