// TaxCloud Lookup Request

var _ = require('underscore');

var ArmariumError = require('../../../api/1.0/armarium/error');

(function(_) {
	
	function LookupRequest(taxcloud) {
		
		this.taxcloud = taxcloud;
		
		this._value = {
			cartItems	: []
		};
		
	}
	
	LookupRequest.prototype.setCustomerId = function (value) {
		
		this._value.customerID = value;
		
		return this;
		
	}
	
	LookupRequest.prototype.setCartId = function (value) {
		
		this._value.cartID = value;
		
		return this;
		
	}
	
	LookupRequest.prototype.setDeliveredBySeller = function (value) {
		
		this._value.deliveredBySeller = value;
		
		return this;
		
	}
	
	LookupRequest.prototype.setOrigin = function (value) {
		
		this._value.origin = this.taxcloud.decodeAddressEntity(value);
		
		return this;
		
	}
	
	LookupRequest.prototype.setDestination = function (value) {
		
		this._value.destination = this.taxcloud.decodeAddressEntity(value);
		
		return this;
		
	}
	
	LookupRequest.prototype.addCartItem = function (id, price, quantity, tic) {
		
		this._value.cartItems.push({
			Index	: _.size(this._value.cartItems),
			ItemID	: id,
			Price	: price,
			Qty		: quantity || 1,
			TIC		: tic || null
		});
		
		return this;
		
	}
	
	LookupRequest.prototype.query = function () {
		
		if (this._value.destination.Country !== 'US')
			return Parse.Promise.as(0);
		
		var self = this;
		
		this._request = this._value;
		
		return this.taxcloud.request('Lookup', this._value, {useTaxCloudCredential: true}).then(
			
			function(response) {
				
				self._response = response;
					
				// TODO RiP
				console.log(response);
				
				if (response && response.status === 200 && _.isObject(response.data)) {
					
					if (response.data.ResponseType === 3 && _.isArray(response.data.CartItemsResponse) && !_.isEmpty(response.data.CartItemsResponse)) {
						
						// TODO RiP
						console.log(JSON.stringify(response.data.CartItemsResponse));
						
						return Parse.Promise.as(
							_.reduce(
								response.data.CartItemsResponse,
								function (memo, item) {
									return memo + (_.has(item, 'TaxAmount') ? item.TaxAmount : 0);
								},
							0)
						);
						
					} else
						return Parse.Promise.error(new ArmariumError(ArmariumError.TAX_CLOUD_LOOKUP_FAILED));
					
				} else
					return Parse.Promise.error(new ArmariumError(ArmariumError.TAX_CLOUD_FAILED));
				
	  		},
	  		function(error) {
	  			
	  			// TODO RiP
				console.log(error);
				
	  			return Parse.Promise.error(new ArmariumError(ArmariumError.TAX_CLOUD_FAILED));

			}
			
		);
		
	}
	
	module.exports = LookupRequest;
	 
}(_));