define([
    'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('_PushStatus', {
		
		_types: {
			pushTime			: Date,
			query				: String,
			payload				: String,
			source				: String,
			status				: String,
			numSent				: Number,
			pushHash			: String,
			createdAt			: Date,
			updatedAt			: Date,
			count				: Number,
			numFailed			: Number,
			failedPerType		: Object,
			sentPerType			: Object
		},
		
		
		getTextMessage : function () {
			
			var result = '';
			
			if (!this.has('payload'))
				return result;
			
			var payload;
			
			try {
				
				payload = JSON.parse(this.get('payload'));
				
				if (_.has(payload, 'alert'))
					result = payload.alert;
				
			} catch (e) {
				
				console.error(e);
				
			}
			
			return result;
			
		}
		
	});
	
	return model;

});