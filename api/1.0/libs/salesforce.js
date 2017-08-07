var jsforce = require('jsforce');
var NodeCache = require('node-cache');

var sfCache = new NodeCache();
var login = function(req, res, next) {
	var cache = {};
	var conn = new jsforce.Connection({
		loginUrl : 'https://test.salesforce.com'
	    //instanceUrl : 'https://cs50.salesforce.com',
  		//accessToken : 'st7uSpkF5QvoHZgsEiMAwFXlh'
	});

	//console.log("Request Body", req.body.username, req.body.password);

	conn.login(req.body.username, req.body.password + req.body.securityToken, function(err, userInfo) {
	  if (err) {
	   console.error(err);
	   return res.status(400).json(ArmariumError.parse(err.message).toString(true));
	  }
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
	  if(success) {
	  	return res.status(200).json(true);	
	  } else {
	  	return res.status(400).json({error: "Failed to save SF Auth info"});
	  }
	});
};

var getConnection = function () {
	var sfAuthInfo = sfCache.get( "sfAuthInfo");

	if (sfAuthInfo == undefined) {
		i
		return null
	} else {
		return sfAuthInfo.conn;
	}
};

var createInventoryFromProduct = function (product) {
	var inventory = {};
	console.log("PRODUCT NAME: ", product.get('name'));
	//inventory.Id = product.get('Id');
	inventory.Name = product.get('name');
	inventory.Brand__c = product.get('brand').get('name');
	inventory.Armarium_Style_Number__c = product.get('styleCode');
	//inventory.Category__c = product.get('category1');
	//inventory.Color__c = product.get('color');
	//inventory.Current_Location = product.
	//inventory.Published = product.
	//inventory.Quantity = 
	inventory.Rental_Price__c = product.get('price');
	inventory.Retail_Price__c = product.get('retailPrice');
	//inventory.Size = product.
	//inventory.Size_Type = 
	inventory.Sub_Category__c = product.get('category2');
	//inventory.US_Size = 
	//inventory.Wholesale_Price = 

	return inventory;
};

module.exports = {
	login: login,
	getConnection: getConnection,
	createInventoryFromProduct: createInventoryFromProduct
}