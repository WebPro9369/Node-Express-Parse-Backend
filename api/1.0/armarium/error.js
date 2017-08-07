// ArmariumError

var _ = require('underscore');

(function(_) {
	
	var
		SEPARATOR = '_KITERROR_';
	
	function ArmariumError(code, message, data) {
		
		if (arguments[0] instanceof Parse.Error) {
			
			this.error = arguments[0];
			this.code = arguments[1] || null;
    		this.message = arguments[2] || null;
    		this.data = arguments[3] || {};
    		
		} else {
			
			this.error = null;
			this.code = arguments[0] || null;
    		this.message = arguments[1] || null;
    		this.data = arguments[2] || {};
			
		}
		
	}
	
	
	_.extend(ArmariumError, {
		
		// Runtime
		PARAM_IS_NOT_SPECIFIED					: 'PARAM_IS_NOT_SPECIFIED',
		PARAM_IS_NOT_VALID						: 'PARAM_IS_NOT_VALID',
		
		// Security
		AUTHORIZATION_IS_REQUIRED				: 'AUTHORIZATION_IS_REQUIRED',
		ACCESS_DENIED							: 'ACCESS_DENIED',
		
		// Workflow
		DATE_RANGE_IS_NOT_VALID					: 'DATE_RANGE_IS_NOT_VALID',
		DATE_IS_NOT_VALID						: 'DATE_IS_NOT_VALID',
		
		TRANSACTION_CREATE_FAILED				: 'TRANSACTION_CREATE_FAILED',
		
		USER_IS_NOT_AVAILABLE					: 'USER_IS_NOT_AVAILABLE',
		USER_UPDATE_FAILED						: 'USER_UPDATE_FAILED',
		
		SHIPPING_ADDRESS_IS_NOT_AVAILABLE		: 'SHIPPING_ADDRESS_IS_NOT_AVAILABLE',
		SHIPPING_ADDRESS_REMOVE_FAILED			: 'SHIPPING_ADDRESS_REMOVE_FAILED',
		
		PAYMENT_CARD_IS_NOT_AVAILABLE			: 'PAYMENT_CARD_IS_NOT_AVAILABLE',
		PAYMENT_CARD_REMOVE_FAILED				: 'PAYMENT_CARD_REMOVE_FAILED',
		
		COLLECTION_IS_NOT_AVAILABLE				: 'COLLECTION_IS_NOT_AVAILABLE',
		
		PRODUCT_IS_NOT_AVAILABLE				: 'PRODUCT_IS_NOT_AVAILABLE',
		
		PRODUCT_DISCOUNT_IS_NOT_AVAILABLE		: 'PRODUCT_DISCOUNT_IS_NOT_AVAILABLE',
		
		PRODUCT_SIZE_IS_NOT_AVAILABLE			: 'PRODUCT_SIZE_IS_NOT_AVAILABLE',
		
		PRODUCT_ORDER_CREATE_FAILED				: 'PRODUCT_ORDER_CREATE_FAILED',
		PRODUCT_ORDER_IS_NOT_AVAILABLE			: 'PRODUCT_ORDER_IS_NOT_AVAILABLE',
		PRODUCT_ORDER_REMOVE_FAILED				: 'PRODUCT_ORDER_REMOVE_FAILED',
		PRODUCT_ORDER_UPDATE_FAILED				: 'PRODUCT_ORDER_UPDATE_FAILED',
		PRODUCT_ORDER_IS_ALREADY_CHARGED		: 'PRODUCT_ORDER_IS_ALREADY_CHARGED',
		PRODUCT_ORDER_IS_NOT_CHARGED			: 'PRODUCT_ORDER_IS_NOT_CHARGED',
		PRODUCT_ORDER_IS_ALREADY_REFUNDED		: 'PRODUCT_ORDER_IS_ALREADY_REFUNDED',
		PRODUCT_ORDER_CONFIRM_FAILED			: 'PRODUCT_ORDER_CONFIRM_FAILED',
		
		SHOWROOM_IS_NOT_AVAILABLE				: 'SHOWROOM_IS_NOT_AVAILABLE',
		
		STYLIST_IS_NOT_AVAILABLE				: 'STYLIST_IS_NOT_AVAILABLE',
		
		STYLIST_ORDER_IS_NOT_AVAILABLE			: 'STYLIST_ORDER_IS_NOT_AVAILABLE',
		STYLIST_ORDER_CREATE_FAILED				: 'STYLIST_ORDER_CREATE_FAILED',
		STYLIST_ORDER_REMOVE_FAILED				: 'STYLIST_ORDER_REMOVE_FAILED',
		STYLIST_ORDER_UPDATE_FAILED				: 'STYLIST_ORDER_UPDATE_FAILED',
		STYLIST_ORDER_IS_ALREADY_CHARGED		: 'STYLIST_ORDER_IS_ALREADY_CHARGED',
		STYLIST_ORDER_IS_NOT_CHARGED			: 'STYLIST_ORDER_IS_NOT_CHARGED',
		STYLIST_ORDER_IS_ALREADY_REFUNDED		: 'STYLIST_ORDER_IS_ALREADY_REFUNDED',
		STYLIST_ORDER_CONFIRM_FAILED			: 'STYLIST_ORDER_CONFIRM_FAILED',
		
		// Stripe
		STRIPE_FAILED							: 'STRIPE_FAILED',
		STRIPE_CARD_ADD_FAILED					: 'STRIPE_CARD_ADD_FAILED',
		
		STRIPE_CARD_ERROR_INVALID_NUMBER		: 'STRIPE_CARD_ERROR_INVALID_NUMBER',
		STRIPE_CARD_ERROR_INVALID_EXPIRY_MONTH	: 'STRIPE_CARD_ERROR_INVALID_EXPIRY_MONTH',
		STRIPE_CARD_ERROR_INVALID_EXPIRY_YEAR	: 'STRIPE_CARD_ERROR_INVALID_EXPIRY_YEAR',
		STRIPE_CARD_ERROR_INVALID_CVC			: 'STRIPE_CARD_ERROR_INVALID_CVC',
		STRIPE_CARD_ERROR_INCORRECT_NUMBER		: 'STRIPE_CARD_ERROR_INCORRECT_NUMBER',
		STRIPE_CARD_ERROR_EXPIRED_CARD			: 'STRIPE_CARD_ERROR_EXPIRED_CARD',
		STRIPE_CARD_ERROR_INCORRECT_CVC			: 'STRIPE_CARD_ERROR_INCORRECT_CVC',
		STRIPE_CARD_ERROR_INCORRECT_ZIP			: 'STRIPE_CARD_ERROR_INCORRECT_ZIP',
		STRIPE_CARD_ERROR_CARD_DECLINED			: 'STRIPE_CARD_ERROR_CARD_DECLINED',
		STRIPE_CARD_ERROR_MISSING				: 'STRIPE_CARD_ERROR_MISSING',
		STRIPE_CARD_ERROR_PROCESSING_ERROR		: 'STRIPE_CARD_ERROR_PROCESSING_ERROR',
		
		// Tax Cloud
		TAX_CLOUD_FAILED						: 'TAX_CLOUD_FAILED',
		TAX_CLOUD_VERIFY_ADDRESS_FAILED			: 'TAX_CLOUD_VERIFY_ADDRESS_FAILED',
		TAX_CLOUD_LOOKUP_FAILED					: 'TAX_CLOUD_LOOKUP_FAILED',
		TAX_CLOUD_COMPLETE_FAILED				: 'TAX_CLOUD_COMPLETE_FAILED',
		TAX_CLOUD_REVERSE_FAILED				: 'TAX_CLOUD_REVERSE_FAILED',
		
		// Campaign Monitor
		CAMPAIGN_MONITOR_FAILED					: 'CAMPAIGN_MONITOR_FAILED',
		
		_messages : {
			
			// Runtime
			PARAM_IS_NOT_SPECIFIED					: '{{ data.name || "parameter" }} is not specified',
			PARAM_IS_NOT_VALID						: '{{ data.name || "parameter" }} is not valid',
			
			// Security
			AUTHORIZATION_IS_REQUIRED				: 'Authorization is required',
			ACCESS_DENIED							: 'Access denied',
			
			// Workflow
			DATE_RANGE_IS_NOT_VALID					: 'Date range is not valid',
			DATE_IS_NOT_VALID						: 'Date is not valid',
			
			TRANSACTION_CREATE_FAILED				: 'Failed to create Transaction',
			
			USER_IS_NOT_AVAILABLE					: 'User is not available',
			USER_UPDATE_FAILED						: 'Failed to update User',
			
			SHIPPING_ADDRESS_IS_NOT_AVAILABLE		: 'Shipping Address is not available',
			SHIPPING_ADDRESS_REMOVE_FAILED			: 'Failed to remove Shipping Address',
			
			PAYMENT_CARD_IS_NOT_AVAILABLE			: 'Payment Card is not available',
			PAYMENT_CARD_REMOVE_FAILED				: 'Failed to remove Payment Card',
			
			COLLECTION_IS_NOT_AVAILABLE				: 'Collection is not available', 
			
			PRODUCT_IS_NOT_AVAILABLE				: 'Product is not available',
			
			PRODUCT_DISCOUNT_IS_NOT_AVAILABLE		: 'Product discount is not available',
			
			PRODUCT_SIZE_IS_NOT_AVAILABLE			: 'Product Size is not available',
			
			PRODUCT_ORDER_CREATE_FAILED				: 'Failed to create Order',
			PRODUCT_ORDER_IS_NOT_AVAILABLE			: 'Order is not available',
			PRODUCT_ORDER_REMOVE_FAILED				: 'Failed to remove Order',
			PRODUCT_ORDER_UPDATE_FAILED				: 'Failed to update Order',
			PRODUCT_ORDER_IS_ALREADY_CHARGED		: 'Order is already charged',
			PRODUCT_ORDER_IS_NOT_CHARGED			: 'Order is not charged',
			PRODUCT_ORDER_IS_ALREADY_REFUNDED		: 'Order is already refunded',
			PRODUCT_ORDER_CONFIRM_FAILED			: 'Failed to confirm Order',
			
			SHOWROOM_IS_NOT_AVAILABLE				: 'Showroom is not available',
			
			STYLIST_IS_NOT_AVAILABLE				: 'Stylist is not available',
			
			STYLIST_ORDER_IS_NOT_AVAILABLE			: 'Order is not available',
			STYLIST_ORDER_CREATE_FAILED				: 'Failed to create Order',
			STYLIST_ORDER_REMOVE_FAILED				: 'Failed to remove Order',
			STYLIST_ORDER_UPDATE_FAILED				: 'Failed to update Order',
			STYLIST_ORDER_IS_ALREADY_CHARGED		: 'Order is already charged',
			STYLIST_ORDER_IS_NOT_CHARGED			: 'Order is not charged',
			STYLIST_ORDER_IS_ALREADY_REFUNDED		: 'Order is already refunded',
			STYLIST_ORDER_CONFIRM_FAILED			: 'Failed to confirm Order',
			
			// Stripe
			STRIPE_FAILED							: 'Stripe service is not available',
			STRIPE_CARD_ADD_FAILED					: 'Failed to add Card',
			
			STRIPE_CARD_ERROR_INVALID_NUMBER		: 'The card number is not a valid credit card number',
			STRIPE_CARD_ERROR_INVALID_EXPIRY_MONTH	: 'The card\'s expiration month is invalid',
			STRIPE_CARD_ERROR_INVALID_EXPIRY_YEAR	: 'The card\'s expiration year is invalid',
			STRIPE_CARD_ERROR_INVALID_CVC			: 'The card\'s security code is invalid',
			STRIPE_CARD_ERROR_INCORRECT_NUMBER		: 'The card number is incorrect',
			STRIPE_CARD_ERROR_EXPIRED_CARD			: 'The card has expired',
			STRIPE_CARD_ERROR_INCORRECT_CVC			: 'The card\'s security code is incorrect',
			STRIPE_CARD_ERROR_INCORRECT_ZIP			: 'The card\'s zip code failed validation',
			STRIPE_CARD_ERROR_CARD_DECLINED			: 'The card was declined',
			STRIPE_CARD_ERROR_MISSING				: 'There is no card on a customer that is being charged',
			STRIPE_CARD_ERROR_PROCESSING_ERROR		: 'An error occurred while processing the card',
			
			// Tax Cloud
			TAX_CLOUD_FAILED						: 'Tax Cloud service is not available',
			TAX_CLOUD_VERIFY_ADDRESS_FAILED			: 'Failed to verify address',
			TAX_CLOUD_LOOKUP_FAILED					: 'Failed to lookup tax',
			TAX_CLOUD_COMPLETE_FAILED				: 'Failed to complete tax',
			TAX_CLOUD_REVERSE_FAILED				: 'Failed to reverse tax',
			
			// Campaign Monitor
			CAMPAIGN_MONITOR_FAILED					: 'Campaign Monitor service is not available'
			
		},
		
		parse : function (value) {
			
			var parts = String(value).split(SEPARATOR);
			
			if (_.size(parts) === 2)
				return new ArmariumError(parts[0], parts[1]);
				
			else
				return new ArmariumError(null, parts[0]);
			
		}
		
	});
	
	
	ArmariumError.prototype.toString = function (brief) {
		
		var result = '';
		
		if (this.code && brief !== true)
			result += this.code + SEPARATOR;
		
		var t;
		
		if (this.message)
			t = _.template(this.message, null, {interpolate: /\{\{(.+?)\}\}/g, variable: 'data'});
			
		else if (this.code && _.has(ArmariumError._messages, this.code))
			t = _.template(ArmariumError._messages[this.code], null, {interpolate: /\{\{(.+?)\}\}/g, variable: 'data'});
		
		else
			t = null;
		
		 
		if (_.isFunction(t))
			result += t(this.data)
		
		if (!result && this.error) {
			
			result += this.error.message;
			
		}
		
		return result;
		
	}
	
	
	module.exports = ArmariumError;
	
	 
} (_));