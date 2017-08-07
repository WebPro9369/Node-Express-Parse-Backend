define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('ProductDiscount', {
		
		_types: {
			title					: String,
			description				: String,
			note					: String,
			oldType					: Number,
			code					: String,
			expiredAt				: Date,
			priority				: Number,
			condition				: Array,
			userGroup				: Array,
			product					: Array,
			productDiscount			: Object,
			deliveryDiscount		: Object,
			insuranceDiscount		: Object,
			totalDiscount			: Object,
			searchable				: Array,
			indexedAt				: Date,
			published				: Boolean
		},
		
		conditionEnum: [
			{id: PRODUCT_DISCOUNT_CONDITION_USER_GROUP_IN_LIST					, text: 'User group is in the list'},
			{id: PRODUCT_DISCOUNT_CONDITION_PRODUCT_IN_LIST						, text: 'Product is in the list'},
			{id: PRODUCT_DISCOUNT_CONDITION_FREE_SHIPPING						, text: 'Free shipping'}
		]
		
	});
	
	return model;

});