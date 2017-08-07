// Fedex Address Entity

var _ = require('underscore');

(function(_) {
	
	var ATTRIBUTES = ['streetLines', 'city', 'stateOrProvinceCode', 'postalCode', 'countryCode'];
	
	function AddressEntity(value) {
		
		this.decode(value);
		
	}
	
	
	AddressEntity.prototype.has = function (name) {
		
		return _.contains(ATTRIBUTES, name) ? _.has(this._value, name) : false;
		
	}
	
	
	AddressEntity.prototype.get = function (name, format) {
		
		if (!_.contains(ATTRIBUTES, name))
			return null;
		
		if (!_.has(this._value, name))
			return null;
		
		var value = this._value[name];
		
		if (name === 'streetLines') {
			
			if (format === 0)
				value = value[0] || null;
			
			else if (format === 1)
				value = value[1] || null;
			
		} else if (name === 'postalCode') {
			
			var raw = value.split(/\-/);
			
			if (format === 'zip5')
				value = raw[0] || null;
			
			else if (format === 'zip4')
				value = raw[1] || null;
			
		}
		
		return value;
		
	}
	
	
	AddressEntity.prototype.set = function (name, value) {
		
		if (_.contains(ATTRIBUTES, name))
			this._value[name] = value;
		
		return this;
		
	}
	
	
	AddressEntity.prototype.unset = function (name) {
		
		if (_.contains(ATTRIBUTES, name)) {
			
			if (this._value && _.has(this._value, name))
				delete this._value[name];
			
		}
		
		return this;
		
	}
	
	
	AddressEntity.prototype.encode = function () {
		
		return !_.isEmpty(this._value) ? this._value : undefined;
		
	}
	

	AddressEntity.prototype.decode = function (value) {
		
		this._value = {};
		
		if (_.isObject(value) && !_.isEmpty(value)) {
		 
			_
			.chain(ATTRIBUTES)
			.each(function (name) {
				
				if (_.has(value, name))
					this._value[name] = value[name];
				
			}, this)
			.value();
		
		}
		
		return this;
		
	}
	
	module.exports = AddressEntity;
	 
}(_));