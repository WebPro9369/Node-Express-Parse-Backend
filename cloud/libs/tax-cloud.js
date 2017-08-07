// TaxCloud wrapper

var _ = require('underscore');

var AddressEntity			= require('../../api/1.0/entities/address');

var VerifyAddressRequest	= require('./tax-cloud/verify-address-request');
var LookupRequest			= require('./tax-cloud/lookup-request');
var CompleteRequest			= require('./tax-cloud/complete-request');
var ReverseRequest			= require('./tax-cloud/reverse-request');

(function(_) {
	
	var TAXCLOUD_API_BASE_URL	= 'https://api.taxcloud.net/1.0/TaxCloud/';
	var TAXCLOUD_API_ID			= '';
	var TAXCLOUD_API_KEY		= '';
	var USPS_USER_ID			= '';
	
	module.exports = {
		
		version: '1.0.0',
		
		
		initialize: function(taxcloudApiId, taxcloudApikey, uspsUserId) {
			
			TAXCLOUD_API_ID		= taxcloudApiId;
			TAXCLOUD_API_KEY	= taxcloudApikey;
			USPS_USER_ID		= uspsUserId;
			
			return this;
		},
		
		
		request : function (service, data, options) {
			
			console.log(service);
			
			if (options.useTaxCloudCredential === true) {
				
				data.apiLoginID = TAXCLOUD_API_ID;
				data.apiKey = TAXCLOUD_API_KEY;
				
			}
			
			if (options.useUspsCredential === true)
				data.uspsUserId = USPS_USER_ID;
			
			console.log(data);
			
			return Parse.Cloud.httpRequest({
				url		: TAXCLOUD_API_BASE_URL + service,
				method	: 'POST',
				headers	: {
					'Content-Type'		: 'application/json'
				},
				body : data
			});
			
		},
		
		verifyAddressRequest : function () {
			return new VerifyAddressRequest(this);
		},
		
		lookupRequest : function () {
			return new LookupRequest(this);
		},
		
		completeRequest : function () {
			return new CompleteRequest(this);
		},
		
		reverseRequest : function () {
			return new ReverseRequest(this);
		},
		
		
		decodeAddressEntity : function (addressEntity) {
			
			return {
				Address1	: addressEntity.get('streetLines', 0),
				Address2	: addressEntity.get('streetLines', 1),
				City		: addressEntity.get('city'),
				State		: addressEntity.get('stateOrProvinceCode'),
				Zip5		: addressEntity.get('postalCode', 'zip5'),
				Zip4		: addressEntity.get('postalCode', 'zip4'),
				Country		: addressEntity.get('countryCode')
			};
			
		},
		
		
		encodeAddressEntity : function (value) {
			
			var addressEntity = new AddressEntity();
			
			addressEntity
				.set('streetLines', _.compact([value.Address1, value.Address2]))
				.set('city', value.City)
				.set('stateOrProvinceCode', value.State)
				.set('countryCode', value.Country)
				.set('postalCode', _.compact([value.Zip5, value.Zip4]).join('-'));
			
			return addressEntity;
			
		}

	}

}(_));