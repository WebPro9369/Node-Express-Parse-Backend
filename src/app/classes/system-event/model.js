define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('SystemEvent', {
		
		_types: {
			type					: Number,
			description				: String,
			params					: Object,
			searchable				: Array,
			indexedAt				: Date,
			published				: Boolean
		},
		
		
		_formats: {
			
			_type : function (model) {
				
				var type = _.findWhere(model.typeEnum, {id: model.get('type')});
				return type ? type.text : null;
				
			}
		
		},
		
		
		typeEnum: [
			{id: SYSTEM_EVENT_TYPE_USER_SIGNED					, text: 'User signup'},
			{id: SYSTEM_EVENT_TYPE_PRODUCT_ORDER_CHARGED		, text: 'User borrow product'}
		],
		
		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		}
		
	});
	
	return model;

});