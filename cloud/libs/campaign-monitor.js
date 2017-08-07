// Campaign Monitor wrapper

var _ = require('underscore');
var ArmariumError = require('../../api/1.0/armarium/error');
var Buffer = require('buffer').Buffer;

(function(_) {
	
	var CAMPAIGN_MONITOR_API_BASE_URL	= 'https://api.createsend.com/api/v3.1';
	var CAMPAIGN_MONITOR_API_KEY		= '';
	
	var METHOD_GET			= 'GET';
	var METHOD_POST			= 'POST';
	var METHOD_DELETE		= 'DELETE';
	

	function _request(method, service, data) {
		
		var auth = new Buffer(CAMPAIGN_MONITOR_API_KEY + ':magic', 'utf8');
		
		var options = {
			url		: CAMPAIGN_MONITOR_API_BASE_URL + service,
			method	: method,
			headers	: {
				'Authorization'		: 'Basic ' + auth.toString('base64'),
				'Content-Type'		: 'application/json'
			},
			body: JSON.stringify(data)
		};
			
		console.log(JSON.stringify(options));
		
		return Parse.Cloud.httpRequest(options).then(
			
			function (response) {
				
				console.log(response);
				
				if (response && _.contains([200, 201, 202], response.status))
					return Parse.Promise.as(true);
					
				else
					return Parse.Promise.error(new ArmariumError(ArmariumError.CAMPAIGN_MONITOR_FAILED));
				
			},
	  		function(response) {
	  			
	  			console.log(response);
	  			console.log(response.text);
				return Parse.Promise.error(new ArmariumError(ArmariumError.CAMPAIGN_MONITOR_FAILED));

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
		
		
		initialize: function(apikey) {
			
			CAMPAIGN_MONITOR_API_KEY	= apikey;
			
		},
		
		
		Subscribers : {
			
			create : function (listId, params) {
				
				return _post('/subscribers/' + listId + '.json', params);
				
			},
			
			remove : function (listId, email) {
				
				return _delete('/subscribers/' + listId + '.json?email=' + email);
				
			}
			
		},
		
		Transactional : {
			
			smartEmailSend : function (smartEmailId, params) {
					
				return _post('/transactional/smartEmail/' + smartEmailId + '/send', params);
					
			}
			
		}

	}

}(_));