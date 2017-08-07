define([
	'underscore'
], function(
	_
) {
	
	var ATTRIBUTES = ['streetLines', 'city', 'stateOrProvinceCode', 'postalCode', 'countryCode'];
	
	function AddressEntity(value) {
		
		_.bindAll(this, 'has', 'get', 'set', 'unset', 'isValid', 'format', 'encode', 'decode');
		
		this.decode(value);
		
	}
	
	
	AddressEntity.prototype.has = function (name) {
		
		return _.contains(ATTRIBUTES, name) ? _.has(this._value, name) : false;
		
	}
	
	
	AddressEntity.prototype.get = function (name) {
		
		return _.contains(ATTRIBUTES, name) ? this._value[name] : undefined;
		
	}
	
	
	AddressEntity.prototype.set = function (name, value) {
		
		if (_.contains(ATTRIBUTES, name)) {
			
			if (name === 'streetLines') {
				
				if (_.size(arguments) > 2)
					this._value[name] = _.rest(arguments);
					
				else if (_.isArray(value))
					this._value[name] = value;
				
				else if (_.isString(value))
					this._value[name] = [value];
				
				
			} else if (_.isString(value))
				this._value[name] = value;
			
		}
		
		return this;
		
	}
	
	
	AddressEntity.prototype.unset = function (name) {
		
		if (_.contains(ATTRIBUTES, name)) {
			
			if (this._value && _.has(this._value, name))
				delete this._value[name];
			
		}
		
		return this;
		
	}
	
	
	// TODO validation
	AddressEntity.prototype.isValid = function () {
		
		return true;
		
	}
	
	
	AddressEntity.prototype.format = function () {
		
		return _.compact(
			[
				(this._value.streetLines || []).join(' ') || '',
				this._value.city || '',
				this._value.stateOrProvinceCode || '',
				this._value.postalCode || '',
				this._value.countryCode || ''
			]
		)
		.join(', ');
		
	}
	
	
	AddressEntity.prototype.encode = function () {
		
		return !_.isEmpty(this._value) ? this._value : undefined;
		
	}
	

	AddressEntity.prototype.decode = function (value) {
		
		if (value instanceof AddressEntity)
			value = value.encode();
		
		this._value = {};
		 
		_
		.chain(ATTRIBUTES)
		.each(function (name) {
			
			if (_.has(value, name))
				this._value[name] = value[name];
			
		}, this)
		.value();
		
		return this;
		
	}
	
	return AddressEntity;
	
});