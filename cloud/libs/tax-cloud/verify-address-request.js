// TaxCloud VerifyAddress Request

var _ = require('underscore');

var ArmariumError = require('../../../api/1.0/armarium/error');

(function(_) {
	
	function VerifyAddressRequest(taxcloud) {
		
		this.taxcloud = taxcloud;
		
		this._value = {};
		
	}

	
	VerifyAddressRequest.prototype.setAddress = function (value) {
		
		this._value = this.taxcloud.decodeAddressEntity(value);
		
		return this;
		
	}

	
	VerifyAddressRequest.prototype.query = function () {
		
		if (this._value.Country !== 'US') {
		
			var result = this.taxcloud.encodeAddressEntity(this._value);
			return Parse.Promise.as(result);
			
		}
		
		var self = this;
		
		this._request = this._value;
		
		return this.taxcloud.request('VerifyAddress', this._value, {useUspsCredential: true}).then(
			
			function(response) {
				
				self._response = response;
				
				// TODO RiP
				console.log(response);
				
				if (response && response.status === 200 && _.isObject(response.data)) {
					
					if (response.data.ErrNumber === '0') {
						
						var result = self.taxcloud.encodeAddressEntity(response.data);
						
						result.set('countryCode', 'US');
						
						return Parse.Promise.as(result);
						
					} else
						return Parse.Promise.error(new ArmariumError(ArmariumError.TAX_CLOUD_VERIFY_ADDRESS_FAILED, response.data.ErrDescription));
					
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
	
	module.exports = VerifyAddressRequest;
	 
}(_));