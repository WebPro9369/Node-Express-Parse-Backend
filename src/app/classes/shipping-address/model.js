define([
	'underscore',
	'parse',
	
	'entities/address'
], function(
	_, Parse,
	AddressEntity
) {
	
	var model = Parse.Object.extend('ShippingAddress', {
		
		_types: {
			user					: Parse.Object,
			fullName				: String,
			streetLines				: Array,
			city					: String,
			stateOrProvinceCode		: String,
			postalCode				: String,
			countryCode				: String,
			value					: AddressEntity,
			validationRequest		: Object,
			validationResponse		: Object,
			removed					: Boolean,
			removedAt				: Date
		},
		
		_formats: {
			_formatted: function (model) {
				return _.compact([(model.get('streetLines') || []).join(' '), model.get('city'), model.get('stateOrProvinceCode'), model.get('postalCode'), model.get('countryCode')]).join(', ');
			}
		},

		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		}
		
	});
	
	return model;

});