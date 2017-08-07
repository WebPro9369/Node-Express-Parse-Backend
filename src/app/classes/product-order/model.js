define([
    'parse'
], function(Parse) {
	
	var model = Parse.Object.extend('ProductOrder', {
		
		_types: {
			createdAt					: Date,
			
			orderNumber					: String,
			state						: Array,
			discounts					: Array,
			discountDescription			: String,
			user						: Parse.Object,
			node						: Number,
			shippingAddress				: Parse.Object,
			paymentCard					: Parse.Object,
			product						: Parse.Object,
			productSize					: Parse.Object,
			dateFrom					: Date,
			dateTill					: Date,
			dateRange					: Array,
			productPrice				: Number,
			productDiscount				: Number,
			productTotal				: Number,
			taxPrice					: Number,
			deliveryPrice				: Number,
			deliveryDiscount			: Number,
			deliveryTotal				: Number,
			insurancePrice				: Number,
			insuranceDiscount			: Number,
			insuranceTotal				: Number,
			totalPrice					: Number,
			totalBalance				: Number,
			totalDiscount				: Number,
			paymentRequest				: String,
			paymentResponse				: String,
			refundRequest				: String,
			refundResponse				: String,
			deliveryShippingRequest		: String,
			deliveryShippingResponse	: String,
			deliveryReceivingRequest	: String,
			deliveryReceivingResponse	: String,
			searchable					: Array,
			indexedAt					: Date
		},
		
		_formats: {
			
			_state : function (model) {
				
				var states = _
					.chain(model.stateEnum)
					.filter(function (value) {return _.contains(this, value.id);}, model.get('state') || [])
					.map(function (value) {return value.text;})
					.value();
				
				return states;
				
			},
			
			_discounts : function (model) {
				
				var discounts = _
					.chain(model.discountsEnum)
					.filter(function (value) {return _.contains(this, value.id);}, model.get('discounts') || [])
					.map(function (value) {return value.text;})
					.value();
				
				return discounts;
				
			},
			
			_productDiscounts : function (model) {
				
				var discounts = _
					.chain(model.get('productDiscounts') || [])
					.filter(function (value) {return value.has('note') && !_.isEmpty(value.get('note'));})
					.map(function (value) {return value.get('note');})
					.value();
				
				return discounts;
				
			},
			
			_node : function (model) {
				
				var node = _.chain(model.nodeEnum).where({id: model.get('node') || 0}).first().value();
				
				return node ? node.text : null;
				
			}
			
		},
		
		stateEnum : [
			{id: PRODUCT_ORDER_STATE_LOCKED		, text: 'Locked'},
			{id: PRODUCT_ORDER_STATE_CONFIRMED	, text: 'Confirmed'},
			{id: PRODUCT_ORDER_STATE_CHARGED	, text: 'Charged'},
			{id: PRODUCT_ORDER_STATE_RETURNED	, text: 'Returned'},
			{id: PRODUCT_ORDER_STATE_DELIVERED	, text: 'Delivered'},
			{id: PRODUCT_ORDER_STATE_REFUNDED	, text: 'Refunded'},
			{id: PRODUCT_ORDER_STATE_REJECTED	, text: 'Rejected'},
			{id: PRODUCT_ORDER_STATE_CANCELED	, text: 'Canceled'},
			{id: PRODUCT_ORDER_STATE_TAXCLOUD_LOOKUPED	, text: 'Taxcloud Lookuped'},
			{id: PRODUCT_ORDER_STATE_TAXCLOUD_CAPTURED	, text: 'Taxcloud Captured'},
			{id: PRODUCT_ORDER_STATE_TAXCLOUD_RETURNED	, text: 'Taxcloud Returned'}
		],
		
		discountsEnum : [
			{id: PRODUCT_DISCOUNT_DEVELOPMENT						, text: 'Development discount'},
			{id: PRODUCT_DISCOUNT_FREE_DELIVERY_TO_SAME_ADDRESS		, text: 'Free delivery to the same address'},
			{id: PRODUCT_DISCOUNT_20_OFF_FIRST_BORROW				, text: '20% off first borrow'},
			{id: PRODUCT_DISCOUNT_30_OFF_EVERY_BORROW_FOR_VIP		, text: '30% off every borrow for VIPs'}
		],
		
		nodeEnum: [
			{id: 1		, text: 'App'},
			{id: 2		, text: 'Website'}
		],
		
		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		},
		
		
		isState : function (state) {
			
			return _.contains(this.get('state') || [], state);
			
		},
		
		actions: function () {
			
			var actions = [];
			
			if (this.isState(PRODUCT_ORDER_STATE_REJECTED) || this.isState(PRODUCT_ORDER_STATE_CANCELED))
				actions = [];
			
			else if (this.isState(PRODUCT_ORDER_STATE_CONFIRMED)) {
				
				if (!this.isState(PRODUCT_ORDER_STATE_RETURNED))
					actions.push(PRODUCT_ORDER_STATE_REJECTED);
				
				if (this.isState(PRODUCT_ORDER_STATE_CHARGED)) {
				
					if (this.isState(PRODUCT_ORDER_STATE_DELIVERED) && !this.isState(PRODUCT_ORDER_STATE_RETURNED))
						actions.push(PRODUCT_ORDER_STATE_RETURNED);
					
					else if (!this.isState(PRODUCT_ORDER_STATE_DELIVERED) && !this.isState(PRODUCT_ORDER_STATE_RETURNED))
						actions.push(PRODUCT_ORDER_STATE_DELIVERED);
					
				}
				
			}
			
			return _.filter(this.stateEnum, function (state) {return _.contains(this, state.id);}, actions);
			
		}
		
	});
	
	return model;

});