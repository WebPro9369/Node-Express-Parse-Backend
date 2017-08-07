define([
    'parse'
], function(Parse) {
	
	var model = Parse.Object.extend('StylistOrder', {
		
		_types: {
			createdAt					: Date,
			
			orderNumber					: String,
			state						: Array,
			discounts					: Array,
			discountDescription			: String,
			user						: Parse.Object,
			shippingAddress				: Parse.Object,
			showroom					: Parse.Object,
			paymentCard					: Parse.Object,
			stylist						: Parse.Object,
			orderDate					: Date,
			orderTime					: Array,
			totalPrice					: Number,
			paymentRequest				: String,
			paymentResponse				: String,
			refundRequest				: String,
			refundResponse				: String,
			searchable					: Array,
			indexedAt					: Date
		},
		
		_formats: {
			
			_orderTime: function (model) {
				
				var ranges = [];
				
				if (model.has('orderTime')) {
				
					ranges.push(_.reduce(model.get('orderTime'), function (memo, value) {
		  
						if (!_.isNull(memo)) {
							
							if (value - memo.till === 1)
								memo.till = value;
								
							else {
								this.push(memo);
								memo = null;
							}
							
						}
						
						if (_.isNull(memo))
							memo = {from: value, till: value};
							
						return memo;
						
					}, null, ranges));
					
					return _.map(ranges, function (range) {return moment.utc(this).hours(range.from).format(TIME_FORMAT) + ' - ' + moment.utc(this).hours(range.till + 1).format(TIME_FORMAT);}, model.get('orderDate'));
					
				} else
					return ranges;
				
			},
			
			_state : function (model) {
				
				var result = _
					.chain(model.stateEnum)
					.filter(function (value) {return _.contains(this, value.id);}, model.get('state') || [])
					.map(function (value) {return value.text;})
					.value();
				
				return result;
				
			},
			
			_discounts : function (model) {
				
				var discounts = _
					.chain(model.discountsEnum)
					.filter(function (value) {return _.contains(this, value.id);}, model.get('discounts') || [])
					.map(function (value) {return value.text;})
					.value();
				
				return discounts;
				
			}
			
		},
		
		stateEnum : [
			{id: STYLIST_ORDER_STATE_LOCKED		, text: 'Locked'},
			{id: STYLIST_ORDER_STATE_CONFIRMED	, text: 'Confirmed'},
			{id: STYLIST_ORDER_STATE_CHARGED	, text: 'Charged'},
			{id: STYLIST_ORDER_STATE_APPROVED	, text: 'Approved'},
			{id: STYLIST_ORDER_STATE_REFUNDED	, text: 'Refunded'},
			{id: STYLIST_ORDER_STATE_REJECTED	, text: 'Rejected'},
			{id: STYLIST_ORDER_STATE_CANCELED	, text: 'Canceled'},
			{id: STYLIST_ORDER_STATE_BOOKED		, text: 'Booked'}
		],
		
		discountsEnum : [
		],
		
		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		},
		
		
		isState : function (state) {
			
			return _.contains(this.get('state') || [], state);
			
		},
		
		actions: function () {
			
			var actions = [];
			
			if (this.isState(STYLIST_ORDER_STATE_REJECTED) || this.isState(STYLIST_ORDER_STATE_CANCELED))
				actions = [];
			
			else if (this.isState(STYLIST_ORDER_STATE_CONFIRMED)) {
				
				if (this.isState(STYLIST_ORDER_STATE_CHARGED) || this.isState(STYLIST_ORDER_STATE_BOOKED))
					actions.push(STYLIST_ORDER_STATE_APPROVED);
				
				actions.push(STYLIST_ORDER_STATE_REJECTED);
				
			}
			
			return _.filter(this.stateEnum, function (state) {return _.contains(this, state.id);}, actions);
			
		}
		
	});
	
	return model;

});