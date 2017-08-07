var _ = require('underscore');

exports.fetchPushNotifications = function (type, page, limit) {
	
	var promises = [];
	
	var query = new Parse.Query('_PushStatus');

	query.skip(page * limit);
	query.limit(limit);
	query.descending('createdAt');
	
	promises.push(query.find({useMasterKey : true}));
	
	promises.push(query.count({useMasterKey : true}));
	
	return Parse.Promise.when(promises).then(
		
		function (result) {
			
			return Parse.Promise.as({
				results	: result[0],
				count	: result[1]
			});
			
		}
		
	);
	
}


exports.sendPushNotification = function (message) {
	
	var pushQuery = new Parse.Query(Parse.Installation);
	
	var data = {
		alert	: message
	};
	
	return Parse.Push.send(
		{
			where	: pushQuery,
			data	: data
		},
		{useMasterKey: true}
	);

}