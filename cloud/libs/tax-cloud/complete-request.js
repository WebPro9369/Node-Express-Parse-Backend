// TaxCloud Complete (AuthorizedWithCapture) Request

var _ = require('underscore');
var moment = require('moment');

var ArmariumError = require('../../../api/1.0/armarium/error');

(function(_, moment) {
	
	function CompleteRequest(taxcloud) {
		
		this.taxcloud = taxcloud;
		
		this.now = moment.utc();
		
		this._value = {
			dateAuthorized		: this.now.format('YYYY-MM-DDTHH:mm:ssZ'),
			dateCaptured		: this.now.format('YYYY-MM-DDTHH:mm:ssZ')
		};
		
	}
	
	CompleteRequest.prototype.setCustomerId = function (value) {
		
		this._value.customerID = value;
		
		return this;
		
	}
	
	CompleteRequest.prototype.setCartId = function (value) {
		
		this._value.cartID = value;
		
		return this;
		
	}
	
	CompleteRequest.prototype.setOrderId = function (value) {
		
		this._value.orderID = value;
		
		return this;
		
	}
	
	CompleteRequest.prototype.query = function () {
		
		var self = this;
		
		this._request = this._value;
		
		return this.taxcloud.request('AuthorizedWithCapture', this._value, {useTaxCloudCredential: true}).then(
			
			function(response) {
				
				self._response = response;
				
				// TODO RiP
				console.log(response);
				
				if (response && response.status === 200 && _.isObject(response.data)) {
					
					if (response.data.ResponseType === 3)
						return Parse.Promise.as(self.now);

					else
						return Parse.Promise.error(new ArmariumError(ArmariumError.TAX_CLOUD_COMPLETE_FAILED));
					
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
	
	module.exports = CompleteRequest;
	 
}(_, moment));