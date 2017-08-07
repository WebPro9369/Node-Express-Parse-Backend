// TaxCloud Reverse (Returned) Request

var _ = require('underscore');
var moment = require('moment');

var ArmariumError = require('../../../api/1.0/armarium/error');

(function(_, moment) {
	
	function ReverseRequest(taxcloud) {
		
		this.taxcloud = taxcloud;
		
		this.now = moment.utc();
		
		this._value = {
			cartItems			: null,
			returnedDate		: this.now.format('YYYY-MM-DDTHH:mm:ssZ')
		};
		
	}
	
	ReverseRequest.prototype.setOrderId = function (value) {
		
		this._value.orderID = value;
		
		return this;
		
	}
	
	ReverseRequest.prototype.query = function () {
		
		var self = this;
		
		this._request = this._value;
		
		return this.taxcloud.request('Returned', this._value, {useTaxCloudCredential: true}).then(
			
			function(response) {
				
				self._response = response;
				
				// TODO RiP
				console.log(response);
				
				if (response && response.status === 200 && _.isObject(response.data)) {
					
					if (response.data.ResponseType === 3)
						return Parse.Promise.as(self.now);

					else
						return Parse.Promise.error(new ArmariumError(ArmariumError.TAX_CLOUD_REVERSE_FAILED));
					
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
	
	module.exports = ReverseRequest;
	 
}(_, moment));