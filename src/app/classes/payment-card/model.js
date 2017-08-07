define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('PaymentCard', {
		
		_types: {
			user					: Parse.Object,
			cardType				: String,
			trailingDigits			: String,
			removed					: Boolean,
			removedAt				: Date
		},
		
		_formats: {
			_formatted: function (model) {
				return _.compact([model.get('cardType'), model.get('trailingDigits')]).join(' ');
			}
		},

		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		}
		
	});
	
	return model;

});