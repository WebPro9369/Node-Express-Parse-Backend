// TaxCloud wrapper

var _ = require('underscore');
var ArmariumError = require('../../api/1.0/armarium/error');
var qs = require('qs');
var Buffer = require('buffer').Buffer;

(function(_) {
	
	var STRIPE_API_BASE_URL	= 'https://api.stripe.com/v1';
	var STRIPE_API_KEY		= '';
	
	var METHOD_GET			= 'GET';
	var METHOD_POST			= 'POST';
	var METHOD_DELETE		= 'DELETE';
	
	var
		ERROR_TYPE_API_CONNECTION_ERROR		= 'api_connection_error',
		ERROR_TYPE_API_ERROR				= 'api_error',
		ERROR_TYPE_AUTHENTICATION_ERROR		= 'authentication_error',
		ERROR_TYPE_CARD_ERROR				= 'card_error',
		ERROR_TYPE_INVALID_REQUEST_ERROR	= 'invalid_request_error',
		ERROR_TYPE_RATE_LIMIT_ERROR			= 'rate_limit_error',
		ERROR_TYPES = [ERROR_TYPE_API_CONNECTION_ERROR, ERROR_TYPE_API_ERROR, ERROR_TYPE_AUTHENTICATION_ERROR, ERROR_TYPE_CARD_ERROR, ERROR_TYPE_INVALID_REQUEST_ERROR, ERROR_TYPE_RATE_LIMIT_ERROR];
	
	var
		ERROR_CODE_INVALID_NUMBER			= 'invalid_number',
		ERROR_CODE_INVALID_EXPIRY_MONTH		= 'invalid_expiry_month',
		ERROR_CODE_INVALID_EXPIRY_YEAR		= 'invalid_expiry_year',
		ERROR_CODE_INVALID_CVC				= 'invalid_cvc',
		ERROR_CODE_INCORRECT_NUMBER			= 'incorrect_number',
		ERROR_CODE_EXPIRED_CARD				= 'expired_card',
		ERROR_CODE_INCORRECT_CVC			= 'incorrect_cvc',
		ERROR_CODE_INCORRECT_ZIP			= 'incorrect_zip',
		ERROR_CODE_CARD_DECLINED			= 'card_declined',
		ERROR_CODE_MISSING					= 'missing',
		ERROR_CODE_PROCESSING_ERROR			= 'processing_error',
		ERROR_CODES = [ERROR_CODE_INVALID_NUMBER, ERROR_CODE_INVALID_EXPIRY_MONTH, ERROR_CODE_INVALID_EXPIRY_YEAR, ERROR_CODE_INVALID_CVC, ERROR_CODE_INCORRECT_NUMBER,
			ERROR_CODE_EXPIRED_CARD, ERROR_CODE_INCORRECT_CVC, ERROR_CODE_INCORRECT_CVC, ERROR_CODE_INCORRECT_ZIP, ERROR_CODE_CARD_DECLINED, ERROR_CODE_MISSING, ERROR_CODE_PROCESSING_ERROR];
		

	function _request(method, service, data) {
		
		var auth = new Buffer(STRIPE_API_KEY + ':', 'utf8');
		
		var options = {
			url		: STRIPE_API_BASE_URL + service,
			method	: method,
			headers	: {
				'Authorization'		: 'Basic ' + auth.toString('base64'),
				'Accept'			: 'application/json',
				'Content-Type'		: 'application/x-www-form-urlencoded'
			},
			body: qs.stringify(data || {}, {arrayFormat: 'brackets'})
		};
			
		console.log(JSON.stringify(options));
		
		return Parse.Cloud.httpRequest(options).then(
			
			function (response) {
				
				console.log('success');
				console.log(response);
				
				if (response && response.status === 200 && _.isObject(response.data))
					return Parse.Promise.as(response.data);
				
				else if (_.isObject(response.data))
					return Parse.Promise.error(new ArmariumError(ArmariumError.STRIPE_FAILED, null, response.data));
					
				else
					return Parse.Promise.error(new ArmariumError(ArmariumError.STRIPE_FAILED));
				
			},
	  		function(response) {
	  			
	  			// TODO RiP
	  			console.log('fail');
				console.log(response);
				if (response && response.status === 402 && _.isObject(response.data) && _.has(response.data, 'error')) {
					
					var
						type = _.contains(ERROR_TYPES, response.data.error.type) ? response.data.error.type : null,
						code = null;
					
					if (type === ERROR_TYPE_CARD_ERROR && _.contains(ERROR_CODES, response.data.error.code))
						code = response.data.error.code;
						
					var errorCode = 'STRIPE';
					
					if (type) {
						
						errorCode += '_' + type.toUpperCase();
						
						if (code)
							errorCode += '_' + code.toUpperCase();
						
					} else
						errorCode += '_' + 'FAILED';
					
					return Parse.Promise.error(new ArmariumError(errorCode, null, response.data));
					
				} else if (_.isObject(response.data))
					return Parse.Promise.error(new ArmariumError(ArmariumError.STRIPE_FAILED, null, response.data));
				
				else
					return Parse.Promise.error(new ArmariumError(ArmariumError.STRIPE_FAILED));

			}
			
		);
		
	}
	
	
	function _get(service, params) {
		
		return _request(METHOD_GET, service, params);
		
	}
	
	function _post(service, params) {
		
		return _request(METHOD_POST, service, params);
		
	}
	
	function _delete(service, params) {
		
		return _request(METHOD_DELETE, service, params);
		
	}
	
	module.exports = {
		
		version: '1.0.0',
		
		
		initialize: function(stripeApikey) {
			
			STRIPE_API_KEY	= stripeApikey;
			
		},
		
		
		Charges : {
			
			create : function (params) {
				
				return _post('/charges', params);
				
			},
			
			refund : function (chargeId, params) {
				
				return _post('/charges/' + chargeId + '/refunds', params);
				
			}
			
		},
		
		
		Customers : {
			
			create: function (params) {
				
				return _post('/customers', params);
				
			},
			
			createCard: function (customerId, params) {
				
				return _post('/customers/' + customerId + '/sources', params);
				
			},
			
			deleteCard: function (customerId, cardId) {
				
				return _delete('/customers/' + customerId + '/sources/' + cardId);
				
			}
			
		}

	}

}(_));