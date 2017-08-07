var _ = require('underscore');
var jsforce = require('jsforce');
var NodeCache = require('node-cache');

var sfCache = new NodeCache();

var login = function() {
	
	var cache = {};
	
	var conn = new jsforce.Connection({
		loginUrl : process.env.SALESFORCE_LOGIN_URL
	});

	return conn.login(
		process.env.SALESFORCE_USERNAME,
		process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN
	).then(
		
		function (userInfo) {
			
			console.log(conn.accessToken);
			console.log(conn.instanceUrl);
			console.log("User ID: " + userInfo.id);
			console.log("Org ID: " + userInfo.organizationId);
			
			cache.accessToken = conn.accessToken;
			cache.instanceUrl = conn.instanceUrl;
			
			cache.userID = userInfo.id;
			cache.orgID = userInfo.organizationId;
			
			cache.conn = conn;
			
			var success = sfCache.set("sfAuthInfo", cache);
			
			if (success)
				return Parse.Promise.as(conn);
					
			else
				return Parse.Promise.error(new Parse.Error(null, 'Failed to save SF Auth info'));
			
		},
		function () {
			return Parse.Promise.error(new Parse.Error(null, 'Failed to log into SF'));
		}
	
	);

};

var getConnection = function () {
	
	var sfAuthInfo = sfCache.get( "sfAuthInfo");

	if (sfAuthInfo === undefined)
		return login();
		
	else
		return Parse.Promise.as(sfAuthInfo.conn);

};

var createInventoryFromProduct = function (product) {
	
	var items = _.map(
		product.get('sizes'),
		function (size) {
			
			var item = {
				ExtId__c	: size.id
			};
			
			var iteratee = function (attr, fieldName) {
				
				var value;
				
				if (_.has(attr, 'reader'))
					value = attr.reader(this, attr.name);
				
				else if (this.has(attr.name))
					value = this.get(attr.name);
				
				if (_.has(attr, 'writer'))
					value = attr.writer(value);
					
				if (!_.isUndefined(value))
					item[fieldName] = value;
				
			};
			
			_.each(
				{
					Name						: {name: 'name'},
					Brand__c					: {name: 'brand'		, reader: function (item, name) {if (item.has(name) && (brand = item.get(name)) && brand.has('name') && (value = brand.get('name')) && _.size(value) > 0) return value;}},
					Armarium_Style_Number__c	: {name: 'styleCode'},
					Category__c					: {name: 'category0'},
					Sub_Category__c				: {name: 'category1'	, writer: function (value) {return _.isString(value) && !_.isEmpty(value) ? value.charAt(0).toUpperCase() + value.slice(1) : undefined;}},
					//Color__c					: {name: 'color'},
					Rental_Price__c				: {name: 'price'},
					Retail_Price__c				: {name: 'retailPrice'},
					Published__c				: {name: 'published'	, writer: function (value) {return value === true ? 'Yes' : 'No';}}
				},
				iteratee,
				product
			);
			
			_.each(
				{
					Size__c						: {name: 'name'			, writer: function (value) {return (_.isString(value) && !_.isEmpty(value) && (parts = value.split(/\s+/)) && _.size(parts) > 0) ? parts[_.size(parts) > 1 ? 1 : 0] : undefined;}},
					Size_Type__c				: {name: 'name'			, writer: function (value) {return (_.isString(value) && !_.isEmpty(value) && (parts = value.split(/\s+/)) && _.size(parts) > 1) ? parts[0] : undefined;}},
					US_Size__c					: {name: 'nameUS'},
					Quantity__c					: {name: 'quantity'		, writer: function (value) {return (_.isNumber(value) && value > 0) ? value : 0;}}
				},
				iteratee,
				size
			);
			
			return item;
			
		}
	);
	
	return items;
	
};

module.exports = {
	login: login,
	getConnection: getConnection,
	createInventoryFromProduct: createInventoryFromProduct
}