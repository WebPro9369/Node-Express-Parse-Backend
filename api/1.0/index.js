var _ = require('underscore');
var moment = require('moment');
var bodyParser = require('body-parser');
var express = require('express');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
// Added by Adrian
var salesforce = require('./libs/salesforce');

require('./libs/underscore.parse');

var UriHelper = require('./helpers/uri');

var ArmariumError = require('./armarium/error');
var DynamicText = require('./armarium/dynamic-text');
var Serializer = require('./libs/serializer');

// Middlewares
var CommonMiddleware = require('./middlewares/common');


var serializer = new Serializer(
	{
		Image			: {
			binary2x				: [true, 'File'],
			binary2x667h			: [true, 'File'],
			binary3x				: [true, 'File'],
			webThumb1x				: [true, 'File'],
			webThumb2x				: [true, 'File'],
			web1x					: [true, 'File'],
			web2x					: [true, 'File'],
			original				: [true, 'File'],
			alignment				: true,
			title					: true,
			href					: true
		},
		ShippingAddress	: {
			id						: true,
			fullName				: true,
			streetLines				: true,
			city					: true,
			stateOrProvinceCode		: true,
			postalCode				: true,
			countryCode				: true,
			default					: true
		},
		PaymentCard		: {
			id						: true,
			cardType				: true,
			trailingDigits			: true,
			default					: true
		},
		User			: {
			username				: true,
			email					: true,
			fullName				: true,
			zipcode					: true,
			phoneNumber				: true,
			defaultShippingAddress	: 'ShippingAddress',
			defaultPaymentCard		: 'PaymentCard',
			balance					: true
		},
		CustomerProfile	: {
			parent					: 'CustomerProfile',
			key						: true,
			isCategory				: true,
			title					: true,
			type					: true,
			multiple				: true,
			note					: true,
			hint					: true,
			placeholders			: true,
			values					: true,
			sortOrder				: true
		},
		Content			: {
			node					: true,
			key						: true,
			index					: true,
			type					: true,
			textValue				: true,
			fileValue				: [true, 'File']
		},
		Agenda			: {
			id						: true,
			slug					: [true, 'Agenda.slug'],
			pageTitle				: [true, 'Agenda.pageTitle'],
			pageDescription			: [true, 'Agenda.pageDescription'],
			pageUri					: [true, 'Agenda.pageUri'],
			theme					: true,
			thumbTitle				: true,
			thumbSubtitle			: true,
			thumbImage				: 'Image',
			listTitle				: true,
			listSubtitle			: true,
			listImage				: 'Image',
			coverTitle				: true,
			coverSubtitle			: true,
			coverImage				: 'Image',
			boxTitle				: true,
			boxSubtitle				: true,
			bannerImage				: 'Image',
			title					: true,
			subtitle				: true,
			text					: true,
			gridImage				: 'Image',
			gridBottomImage			: 'Image',
			browseTitle				: true,
			browseSubtitle			: true,
			browseUrl				: true,
			browseImage				: 'Image',
			carouselOrder			: true,
			carouselUrl				: true,
			sortOrder				: true,
			createdAt				: true,
			inSlider				: true,
			primary					: true
		},
		Brand			: {
			id						: true,
			name					: true,
			brandDescription		: true,
			image					: 'Image',
			cover					: 'Image',
			sortOrder				: true,
			inSlider				: true,
			primary					: true
		},
		Collection		: {
			id						: true,
			slug					: [true, 'Collection.slug'],
			pageTitle				: [true, 'Collection.pageTitle'],
			pageDescription			: [true, 'Collection.pageDescription'],
			pageUri					: [true, 'Collection.pageUri'],
			name					: true,
			subtitle				: true,
			seasonDescription		: true,
			preview					: 'Image',
			cover					: 'Image',
			product					: 'Product',
			sortOrder				: true,
			private					: true
		},
		ProductSize		: {
			id						: true,
			name					: true,
			nameUS					: true,
			quantity				: true
		},
		Product			: {
			id						: true,
			slug					: [true, 'Product.slug'],
			pageTitle				: [true, 'Product.pageTitle'],
			pageDescription			: [true, 'Product.pageDescription'],
			pageUri					: [true, 'Product.pageUri'],
			brand					: 'Brand',
			name					: true,
			details					: true,
			pdpDetails				: true,
			pdpFit					: true,
			pdpSize					: true,
			pdpCompleteLook			: true,
			pdpLookDetails			: [true, 'Product.pdpLookDetails'],
			styleNote				: true,
			pronoun					: true,
			shareLink				: true,
			styleCode				: true,
			color					: true,
			categories				: true,
			category1				: true,
			category2				: true,
			price					: true,
			priceRange				: true,
			retailPrice				: true,
			sizes					: 'ProductSize',
			sizeRangeUS				: true,
			photos					: 'Image',
			preview					: 'Image',
			sortOrder				: true
		},
		ProductDiscount	: {
			id						: true,
			note					: true,
			code					: true,
			expiredAt				: true
		},
		ProductOrder	: {
			id						: true,
			createdAt				: true,
			orderNumber				: true,
			state					: true,
			discountDescription		: true,
			productDiscounts		: 'ProductDiscount',
			shippingAddress			: 'ShippingAddress',
			paymentCard				: 'PaymentCard',
			product					: 'Product',
			productSize				: 'ProductSize',
			dateFrom				: true,
			dateTill				: true,
			dateRange				: true,
			productPrice			: true,
			productDiscount			: true,
			productTotal			: true,
			taxPrice				: true,
			deliveryPrice			: true,
			deliveryDiscount		: true,
			deliveryTotal			: true,
			insurancePrice			: true,
			insuranceDiscount		: true,
			insuranceTotal			: true,
			totalPrice				: true,
			totalBalance			: true,
			totalDiscount			: true,
			userBalanceRemaining	: true
		},
		Showroom		: {
			id						: true,
			address					: true
		},
		StylistTutorial	: {
			id						: true,
			name					: true,
			details					: true,
			preview					: 'Image',
			sortOrder				: true
		},
		Stylist			: {
			id						: true,
			slug					: [true, 'Stylist.slug'],
			pageTitle				: [true, 'Stylist.pageTitle'],
			pageDescription			: [true, 'Stylist.pageDescription'],
			pageUri					: [true, 'Stylist.pageUri'],
			fullName				: true,
			details					: true,
			city					: true,
			price					: true,
			photo					: 'Image',
			showroom				: 'Showroom',
			gender					: true,
			previousJob				: true,
			socialLink				: true,
			sortOrder				: true
		},
		StylistOrder	: {
			id						: true,
			createdAt				: true,
			orderNumber				: true,
			state					: true,
			shippingAddress			: 'ShippingAddress',
			showroom				: 'Showroom',
			stylist					: 'Stylist',
			orderDate				: true,
			orderTime				: true,
			totalPrice				: true
		}
	},
	{
		File						: function (value) {
			
			if (value instanceof Parse.File) {
				
				var url = String(value.url()).replace(/^http\:\/\//, 'https://');
				
				if (process.env.CDN_URL)
					url = url.replace(process.env.S3_URL, process.env.CDN_URL);
				
				return url;
				
			} else
				return undefined;
			
		},
		'Product.pdpLookDetails'	: function (value, item) {
			
			if (!item.has('pdpLookType'))
				return;
				
			var
				params = item.toJSON();
			
			if (item.has('stylist') && (stylist = item.get('stylist')) && stylist.get('published') === true)
				params.stylist = stylist.toJSON();
			
			var
				dt = new DynamicText(item.get('pdpLookType'), params);
			
			return dt.toString();
	
		},
		'ProductOrder.totalUserBalance'	: function (value, item, options) {
			
			console.log('ProductOrder.totalUserBalance')
			console.log(JSON.stringify(options))
			
			if (!(_.has(options, 'user') && (options.user instanceof Parse.User) && options.user.has('balance')))
				return;
				
			var balance = options.user.get('balance');
			
			return balance >= 0 ? balance : undefined;
			
		},
		'Collection.pageTitle' : function (value, item) {
			
			if (!item.has('name'))
				return;
			
			var
				params = item.toJSON(),
				dt = new DynamicText(3, params);
			
			return dt.toString();
			
		},
		'Collection.pageDescription' : function (value, item) {
			
			if (!item.has('name'))
				return;
			
			var
				params = item.toJSON(),
				dt = new DynamicText(4, params);
			
			return dt.toString();
			
		},
		'Collection.slug' : function (value, item) {
			
			if (!item.has('name'))
				return;
			
			var
				params = item.toJSON();
				
			return UriHelper.encode(params.name);
			
		},
		'Collection.pageUri' : function (value, item) {
			
			if (!item.has('name'))
				return;
			
			var
				params = item.toJSON();
				
			params.pageCode = UriHelper.encode(params.name);
			
			var
				dt = new DynamicText(5, params);
			
			return dt.toString();
			
		},
		'Product.pageTitle' : function (value, item) {
			
			if (!item.has('name'))
				return;
			
			var
				params = item.toJSON(),
				dt;
			
			if (item.has('brand') && (brand = item.get('brand')) && brand.has('name')) {
				
				params.brand = brand.toJSON();
				dt = new DynamicText(6, params);
				
			} else
				dt = new DynamicText(7, params);
				
			return dt.toString();
			
		},
		'Product.pageDescription' : function (value, item) {
			
			if (!item.has('name'))
				return;
			
			var
				params = item.toJSON(),
				dt;
			
			if (item.has('brand') && (brand = item.get('brand')) && brand.has('name')) {
				
				params.brand = brand.toJSON();
				dt = new DynamicText(8, params);
				
			} else
				dt = new DynamicText(9, params);
			
			return dt.toString();
			
		},
		'Product.slug' : function (value, item) {
			
			if (!item.has('name'))
				return;
			
			var
				slug = [];
			
			if (item.has('brand') && (brand = item.get('brand')) && brand.has('name'))
				slug.push(brand.get('name'));
			
			slug.push(item.get('name'));
				
			return UriHelper.encode(slug.join('-'));
			
		},
		'Product.pageUri' : function (value, item) {
			
			if (!item.has('name'))
				return;
			
			var
				slug = [],
				params = item.toJSON();
			
			if (item.has('brand') && (brand = item.get('brand')) && brand.has('name'))
				slug.push(brand.get('name'));
			
			slug.push(item.get('name'));
				
			params.pageCode = UriHelper.encode(slug.join('-'));
			
			var
				dt = new DynamicText(10, params);
			
			return dt.toString();
			
		},
		'Stylist.pageTitle' : function (value, item) {
			
			if (!item.has('fullName'))
				return;
			
			var
				params = item.toJSON(),
				dt = new DynamicText(11, params);
			
			return dt.toString();
			
		},
		'Stylist.pageDescription' : function (value, item) {
			
			if (!item.has('fullName'))
				return;
			
			var
				params = item.toJSON(),
				dt = new DynamicText(12, params);
			
			return dt.toString();
			
		},
		'Stylist.slug' : function (value, item) {
			
			if (!item.has('fullName'))
				return;
			
			var
				params = item.toJSON();
				
			return UriHelper.encode(params.fullName);
			
		},
		'Stylist.pageUri' : function (value, item) {
			
			if (!item.has('fullName'))
				return;
			
			var
				params = item.toJSON();
				
			params.pageCode = UriHelper.encode(params.fullName);
			
			var
				dt = new DynamicText(13, params);
			
			return dt.toString();
			
		},
		'Agenda.pageTitle' : function (value, item) {
			
			if (!item.has('title'))
				return;
			
			var
				params = item.toJSON(),
				dt = new DynamicText(14, params);
			
			return dt.toString();
			
		},
		'Agenda.pageDescription' : function (value, item) {
			
			if (!item.has('title'))
				return;
			
			var
				params = item.toJSON(),
				dt = new DynamicText(15, params);
			
			return dt.toString();
			
		},
		'Agenda.slug' : function (value, item) {
			
			if (!item.has('title'))
				return;
			
			var
				params = item.toJSON();
				
			return UriHelper.encode(params.title);
			
		},
		'Agenda.pageUri' : function (value, item) {
			
			if (!item.has('title'))
				return;
			
			var
				params = item.toJSON();
				
			params.pageCode = UriHelper.encode(params.title);
			
			var
				dt = new DynamicText(16, params);
			
			return dt.toString();
			
		}
	}
);


var router = express.Router();

router.use(methodOverride('_method'))
router.use(cookieParser('RM4aJJ8va1NQ'));

router.all('*', CommonMiddleware.corsHandler);
router.all('*', CommonMiddleware.headerHandler);
router.all('*', bodyParser.json({type: 'application/json'}));
router.all('*', bodyParser.json({type: 'text/plain'}));//application/json {type: '*/*'}
router.all('*', bodyParser.urlencoded({type: 'application/x-www-form-urlencoded'}));
//include=brand&include=&collection=qCPpcYv2Rh


// TODO Profile section


var userLogin = function(req, res, next) {
	
	Parse.User.logIn(req.body.username, req.body.password).then(
		
		function(user) {
			req.user = user;
			req.result = true;
			next();
		},
		function(error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	); 
	
};


var userReset = function(req, res, next) {
	
	Parse.User.requestPasswordReset(req.body.email).then(
		
		function(session) {
			
			req.result = true;
			next();

		},
		function(error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};

 
var userSignup = function(req, res, next) {
	
	var params = {
		email: req.body.username
	};
	
	if (_.requestMatch(req.body, 'fullName', 'String'))
		params.fullName = req.body.fullName;
	
	if (_.requestMatch(req.body, 'phoneNumber', 'String'))
		params.phoneNumber = req.body.phoneNumber;
	
	if (_.requestMatch(req.body, 'zipcode', 'String'))
		params.zipcode = req.body.zipcode;
	
	Parse.User.signUp(req.body.username, req.body.password, params).then(
		
		function(session) {
			req.result = true;
			next();
		},
		function(error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};

 
var userGet = function(req, res, next) {
	
	Parse.Cloud.run('userGet').then(
		
		function (result) {
			req.result = serializer.serialize(result, 'User', {forceObject: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var userUpdate = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.body, 'fullName', 'String'))
		params.fullName = req.body.fullName;
	
	if (_.requestMatch(req.body, 'phoneNumber', 'String'))
		params.phoneNumber = req.body.phoneNumber;
	
	if (_.requestMatch(req.body, 'zipcode', 'String'))
		params.zipcode = req.body.zipcode;
	
	Parse.Cloud.run('userUpdate', params).then(
		
		function(result) {
			req.result = serializer.serialize(result, 'User', {forceObject: true});
			next();
		},
		function(error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var shippingAddressList = function(req, res, next) {
	
	var params = {};
	
	var promises = [];
	
	promises.push(Parse.Cloud.run('userGet'));
	promises.push(Parse.Cloud.run('shippingAddressList', params));
	
	Parse.Promise.when(promises).then(
		
		function (result) {
			
			user = result[0];
			results = result[1];
			
			var items = _.map(
				serializer.serialize(results, 'ShippingAddress', {forceArray: true}),
				function (item) {
					
					if (user.has('defaultShippingAddress') && item.id === user.get('defaultShippingAddress').id)
						item.default = true;
					
					return item;
					
				}
			);
			
			return Parse.Promise.as(items);
			
		},
		function (errors) {
			return Parse.Promise.error(_.firstError(errors));
		}
		
	).then(
		
		function (results) {
			req.result = results;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var shippingAddressAdd = function(req, res, next) {
	
	var shippingAddress;
	
	var params = {};
	
	if (_.requestMatch(req.body, 'fullName', 'String'))
		params.fullName = req.body.fullName;
	
	if (_.requestMatch(req.body, 'streetLines', 'Array'))
		params.streetLines = req.body.streetLines;
	
	else if (_.requestMatch(req.body, 'streetLines', 'String'))
		params.streetLines = [req.body.streetLines];
	
	if (_.requestMatch(req.body, 'city', 'String'))
		params.city = req.body.city;
	
	if (_.requestMatch(req.body, 'stateOrProvinceCode', 'String'))
		params.stateOrProvinceCode = req.body.stateOrProvinceCode;
	
	if (_.requestMatch(req.body, 'postalCode', 'String'))
		params.postalCode = req.body.postalCode;
	
	if (_.requestMatch(req.body, 'countryCode', 'String'))
		params.countryCode = req.body.countryCode;
	
	Parse.Cloud.run('shippingAddressAdd', params).then(
		
		function (result) {
			
			shippingAddress = result;
			
			if (result.valid === true && _.requestMatch(req.body, 'default', 'Boolean') && req.body.default === true)
				return Parse.Cloud.run('shippingAddressSetDefault', {shippingAddress: result.value.id});
			
			return Parse.Promise.as();
		}
		
	).then(
		function () {
			req.result = shippingAddress;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var shippingAddressRemove = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'shippingAddress', 'Id'))
		params.shippingAddress = req.params.shippingAddress;
	
	Parse.Cloud.run('shippingAddressRemove', params).then(
		
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var shippingAddressSetDefault = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'shippingAddress', 'Id'))
		params.shippingAddress = req.params.shippingAddress;
	
	Parse.Cloud.run('shippingAddressSetDefault', params).then(
		
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var paymentCardList = function(req, res, next) {
	
	var params = {};
	
	var promises = [];
	
	promises.push(Parse.Cloud.run('userGet'));
	promises.push(Parse.Cloud.run('paymentCardList', params));
	
	Parse.Promise.when(promises).then(
		
		function (result) {
			
			user = result[0];
			results = result[1];
			
			var items = _.map(
				serializer.serialize(results, 'PaymentCard', {forceArray: true}),
				function (item) {
					
					if (user.has('defaultPaymentCard') && item.id === user.get('defaultPaymentCard').id)
						item.default = true;
					
					return item;
					
				}
			);
			
			return Parse.Promise.as(items);
			
		},
		function (errors) {
			return Parse.Promise.error(_.firstError(errors));
		}
		
	).then(
		
		function (results) {
			req.result = results;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var paymentCardAdd = function(req, res, next) {
	
	var paymentCard;
	
	var params = {};
	
	if (_.requestMatch(req.body, 'token', 'String'))
		params.token = req.body.token;
	
	// TODO RiP begin
	
	if (_.requestMatch(req.body, 'exp_month', 'String'))
		params.exp_month = req.body.exp_month;
	
	if (_.requestMatch(req.body, 'exp_year', 'String'))
		params.exp_year = req.body.exp_year;
	
	if (_.requestMatch(req.body, 'number', 'String'))
		params.number = req.body.number;
	
	if (_.requestMatch(req.body, 'cvc', 'String'))
		params.cvc = req.body.cvc;
		
	// TODO RiP end
	
	Parse.Cloud.run('paymentCardAdd', params).then(
		
		function (result) {
			
			paymentCard = result;
			
			if ((paymentCard instanceof Parse.Object) && _.requestMatch(req.body, 'default', 'Boolean') && req.body.default === true)
				return Parse.Cloud.run('paymentCardSetDefault', {paymentCard: paymentCard.id});
			
			return Parse.Promise.as();
			
		}
		
	).then(
		
		function () {
			req.result = serializer.serialize(paymentCard, 'PaymentCard');
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var paymentCardRemove = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'paymentCard', 'Id'))
		params.paymentCard = req.params.paymentCard;
	
	Parse.Cloud.run('paymentCardRemove', params).then(
		
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var paymentCardSetDefault = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'paymentCard', 'Id'))
		params.paymentCard = req.params.paymentCard;
	
	Parse.Cloud.run('paymentCardSetDefault', params).then(
		
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var userWishListGet = function(req, res, next) {
	
	var params = {};
	
	Parse.Cloud.run('userWishList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Product', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var userWishListPost = function(req, res, next) {
	
	var includes = ['brand', 'brand.image', 'brand.cover', 'sizes', 'photos', 'preview'];
	
	var params = {};
	
	if (_.requestMatch(req.body, 'include', 'Array') || _.requestMatch(req.body, 'include', 'String')) {
		
		var include = _.intersection(includes, _.isArray(req.body.include) ? req.body.include : [req.body.include]);
		
		if (!_.isEmpty(include))
			params.include = include;
		
	}
	
	Parse.Cloud.run('userWishList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Product', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var userWishListPut = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'product', 'Id'))
		params.product = req.params.product;
	
	Parse.Cloud.run('userWishListPut', params).then(
		
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var userWishListDelete = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'product', 'Id'))
		params.product = req.params.product;
	
	Parse.Cloud.run('userWishListDelete', params).then(
		
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var custromerProfileList = function(req, res, next) {
	
	var params = {};
	
	Parse.Cloud.run('custromerProfileList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'CustomerProfile', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var customerProfileGet = function(req, res, next) {
	
	var params = {};
	
	Parse.Cloud.run('customerProfileGet', params).then(
		
		function (result) {
			req.result = result || [];
			next();
		},
		function (error) {
			console.log(error);
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var customerProfileSet = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.body, 'customerProfile', 'Object'))
		params.customerProfile = req.body.customerProfile;
	
	Parse.Cloud.run('customerProfileSet', params).then(
		
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


// TODO Content section


var contentList = function(req, res, next) {
	
	var params = {
		node		: 2
	};
	
	if (_.requestMatch(req.body, 'key', 'String'))
		params.key = req.body.key;
	
	Parse.Cloud.run('contentList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Content', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var agendaList = function(req, res, next) {
	
	var params = {};
	
	Parse.Cloud.run('agendaList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Agenda', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


// TODO Product section


var brandList = function(req, res, next) {
	
	var params = {
		include 	: 'cover'
	};
	
	Parse.Cloud.run('brandList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Brand', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var collectionListGet = function(req, res, next) {
	
	var params = {
		include 		: 'cover',
		includePrivate	: req.query.include_private === 'true'
	};
	
	Parse.Cloud.run('collectionList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Collection', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var collectionListPost = function(req, res, next) {
	
	var includes = ['preview', 'cover', 'product', 'product.brand', 'product.brand.image', 'product.brand.cover', 'product.sizes', 'product.photos', 'product.preview'];
	
	var params = {
		includePrivate	: req.body.include_private === true
	};
	
	if (_.requestMatch(req.body, 'include', 'Array') || _.requestMatch(req.body, 'include', 'String')) {
		
		var include = _.intersection(includes, _.isArray(req.body.include) ? req.body.include : [req.body.include]);
		
		if (!_.isEmpty(include))
			params.include = include;
		
	}
	
	Parse.Cloud.run('collectionList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Collection', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var productFilterList = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'key', 'String'))
		params.key = req.params.key;
	
	Parse.Cloud.run('productFilterList', params).then(
		
		function (results) {
			req.result = _.map(results, function (item) {return _.pick(item, 'value', 'text');});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var productList = function(req, res, next) {
	
	console.log(req.body)
	
	var
		defaultIncludes = ['brand', 'stylist'],
		includes = ['brand', 'brand.image', 'brand.cover', 'sizes', 'photos', 'preview', 'stylist'];
	
	var params = {};
	
	if (_.requestMatch(req.body, 'dateFrom', 'String'))
		params.dateFrom = req.body.dateFrom;
	
	if (_.requestMatch(req.body, 'dateTill', 'String'))
		params.dateTill = req.body.dateTill;
	
	if (_.requestMatch(req.body, 'collection', 'Id'))
		params.collection = req.body.collection;
		
	else {
		
		if (_.requestMatch(req.body, 'skip', 'Number') && req.body.skip >= 0)
			params.skip = req.body.skip;
		
		if (_.requestMatch(req.body, 'limit', 'Number') && req.limit.skip >= 1)
			params.limit = req.body.limit;
		
	}
	
	if (_.requestMatch(req.body, 'filter', 'Object'))
		params.filter = req.body.filter;
	
	if (_.requestMatch(req.body, 'include', 'Array') || _.requestMatch(req.body, 'include', 'String')) {
		
		var include = _.intersection(includes, _.isArray(req.body.include) ? req.body.include : [req.body.include]);
		
		if (!_.isEmpty(include))
			params.include = include;
		
	}
	
	params.include = _.union(params.include || [], defaultIncludes);
	
	Parse.Cloud.run('productList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Product', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var productSizeList = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'product', 'Id'))
		params.product = req.params.product;

	if (_.requestMatch(req.body, 'dateFrom', 'String'))
		params.dateFrom = req.body.dateFrom;
	
	if (_.requestMatch(req.body, 'dateTill', 'String'))
		params.dateTill = req.body.dateTill;
	
	Parse.Cloud.run('productSizeList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'ProductSize', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var productSizeUnavailability = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'productSize', 'Id'))
		params.productSize = req.params.productSize;

	if (_.requestMatch(req.body, 'dateFrom', 'String'))
		params.dateFrom = req.body.dateFrom;
	
	if (_.requestMatch(req.body, 'dateTill', 'String'))
		params.dateTill = req.body.dateTill;
	
	Parse.Cloud.run('productSizeUnavailability', params).then(
		
		function (results) {
			req.result = results;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var productSizeLookup = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'productSize', 'Id'))
		params.productSize = req.params.productSize;

	if (_.requestMatch(req.body, 'dateFrom', 'String'))
		params.dateFrom = req.body.dateFrom;
	
	if (_.requestMatch(req.body, 'dateTill', 'String'))
		params.dateTill = req.body.dateTill;
	
	Parse.Cloud.run('productSizeLookup', params).then(
		
		function (results) {
			req.result = results;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var productOrderCreate = function(req, res, next) {
	
	var params = {
		node		: 2
	};
	
	if (_.requestMatch(req.body, 'productSize', 'Id'))
		params.productSize = req.body.productSize;
	
	if (_.requestMatch(req.body, 'shippingAddress', 'Id'))
		params.shippingAddress = req.body.shippingAddress;

	if (_.requestMatch(req.body, 'dateFrom', 'String'))
		params.dateFrom = req.body.dateFrom;
	
	if (_.requestMatch(req.body, 'dateTill', 'String'))
		params.dateTill = req.body.dateTill;
	
	Parse.Cloud.run('productOrderCreate', params).then(
		
		function (result) {
			req.result = serializer.serialize(result, 'ProductOrder');
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var productOrderRelease = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'productOrder', 'Id'))
		params.productOrder = req.params.productOrder;
	
	Parse.Cloud.run('productOrderRelease', params).then(
		
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
		
};


var productOrderUpdate = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'productOrder', 'Id'))
		params.productOrder = req.params.productOrder;
	
	var promise = Parse.Promise.as();
	
	if (_.requestMatch(req.body, 'productDiscountCode', 'String')) {
		
		params.productDiscountCode = req.body.productDiscountCode;
		
		promise = promise.then(
			
			function () {
				
				return Parse.Cloud.run('productOrderSetDiscount', params);
				
			}
			
		);
		
	} else if (_.requestMatch(req.body, 'shippingAddress', 'Id')) {
		
		params.shippingAddress = req.body.shippingAddress;
		
		promise = promise.then(
			
			function () {
				
				return Parse.Cloud.run('productOrderSetShippingAddress', params);
				
			}
			
		);
		
	}
		
	promise.then(
		
		function (result) {
			req.result = serializer.serialize(result, 'ProductOrder');
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
		
};


var productOrderConfirm = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.params, 'productOrder', 'Id'))
		params.productOrder = req.params.productOrder;
	
	if (_.requestMatch(req.body, 'paymentCard', 'Id'))
		params.paymentCard = req.body.paymentCard;
	
	Parse.Cloud.run('productOrderConfirm', params).then(
		
		function (result) {
			req.result = serializer.serialize(result, 'ProductOrder');
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
		
};


var productOrderList = function(req, res, next) {
	
	var includes = ['productDiscounts', 'shippingAddress', 'paymentCard', 'product.brand', 'product.brand.image', 'product.brand.cover', 'product.sizes', 'product.photos', 'product.preview', 'productSize'];
	
	var params = {};
	
	if (_.requestMatch(req.body, 'upcoming', 'Boolean'))
		params.upcoming = req.body.upcoming;
	
	if (_.requestMatch(req.body, 'include', 'Array') || _.requestMatch(req.body, 'include', 'String')) {
		
		var include = _.intersection(includes, _.isArray(req.body.include) ? req.body.include : [req.body.include]);
		
		if (!_.isEmpty(include))
			params.include = include;
		
	}
	
	Parse.Cloud.run('productOrderList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'ProductOrder', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


// TODO Stylist section


var stylistTutorialList = function(req, res, next) {
	
	var params = {
		include 	: 'preview'
	};
	
	Parse.Cloud.run('stylistTutorialList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'StylistTutorial', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var stylistList = function(req, res, next) {
	
	var includes = ['photo', 'showroom'];
	
	var params = {};
	
	if (_.requestMatch(req.body, 'include', 'Array') || _.requestMatch(req.body, 'include', 'String')) {
		
		var include = _.intersection(includes, _.isArray(req.body.include) ? req.body.include : [req.body.include]);
		
		if (!_.isEmpty(include))
			params.include = include;
		
	}
	
	if (_.requestMatch(req.body, 'zip', 'String'))
		params.zip = req.body.zip;
	
	Parse.Cloud.run('stylistList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'Stylist', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var stylistBooking = function(req, res, next) {
	
	var params = {};
	
	if (_.requestMatch(req.body, 'stylist', 'Id'))
		params.stylist = req.body.stylist;
	
	if (_.requestMatch(req.body, 'date', 'String'))
		params.date = req.body.date;

	if (_.requestMatch(req.body, 'shippingAddress', 'Id'))
		params.shippingAddress = req.body.shippingAddress;
	
	if (_.requestMatch(req.body, 'showroom', 'Id'))
		params.showroom = req.body.showroom;
	
	Parse.Cloud.run('stylistBooking', params).then(
		
		function (result) {
			req.result = serializer.serialize(result, 'StylistOrder');
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};


var stylistOrderList = function(req, res, next) {
	
	var includes = ['shippingAddress', 'showroom', 'stylist', 'stylist.photo', 'stylist.showroom'];

	var params = {};
	
	if (_.requestMatch(req.body, 'upcoming', 'Boolean'))
		params.upcoming = req.body.upcoming;
	
	if (_.requestMatch(req.body, 'include', 'Array') || _.requestMatch(req.body, 'include', 'String')) {
		
		var include = _.intersection(includes, _.isArray(req.body.include) ? req.body.include : [req.body.include]);
		
		if (!_.isEmpty(include))
			params.include = include;
		
	}
	
	Parse.Cloud.run('stylistOrderList', params).then(
		
		function (results) {
			req.result = serializer.serialize(results, 'StylistOrder', {forceArray: true});
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
		
	);
	
};

//////

var productById = function(req, res, next) {
	var params = {};
	
	if (_.requestMatch(req.query, 'Id', 'String'))
		params.Id = req.query.Id;

	Parse.Cloud.run('getProductById', params).then(
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
	);
};

var getAccounts = function(req, res, next) {
	var params = {};
	Parse.Cloud.run('getAccounts', params).then(
		function (result) {
			req.result = result;
			next();
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
	);
};

var sfCreateInventory = function(req, res, next) {
	var conn = salesforce.getConnection();
	if (!conn) {
		return res.status(401).json({error: "Salesforce login is required."});
	}

	var params = {};
	if(_.requestMatch(req.body, 'Id', 'String')) {
		params.Id = req.body.Id;
	}
	Parse.Cloud.run('getProductById', params).then(
		function (result) {
			var inventory = salesforce.createInventoryFromProduct(result);
			conn.sobject("Inventory__c").upsert(inventory, 'Name', function(err, ret) {
			  if (!err && ret.success) {
			  	console.log('Upserted Successfully');
	  			req.result = inventory;
				next();
			  } else { 
			  	next(ArmariumError.parse(err.message).toString(true));
			  	return console.error(err, ret); 
			  }
			  	
			})
			/*req.result = inventory;
			next();*/
		},
		function (error) {
			next(ArmariumError.parse(error.message).toString(true));
		}
	);
};
/// Salesforce functionality
router.post('/sf/login', salesforce.login);
router.post('/sf/createInventory', sfCreateInventory, CommonMiddleware.successHandler);
router.get('/sf/accounts', getAccounts, CommonMiddleware.successHandler);

///
router.get('/sf/productbyid', productById, CommonMiddleware.successHandler);
router.post('/user/login', userLogin, CommonMiddleware.sessionHandler, CommonMiddleware.successHandler);
router.post('/user/reset', userReset, CommonMiddleware.successHandler);
router.put('/user', userSignup, CommonMiddleware.sessionHandler, CommonMiddleware.successHandler);
router.get('/user', userGet, CommonMiddleware.successHandler);
router.post('/user', userUpdate, CommonMiddleware.successHandler);
router.get('/user/shipping-address', shippingAddressList, CommonMiddleware.successHandler);
router.put('/user/shipping-address', shippingAddressAdd, CommonMiddleware.successHandler);
router.delete('/user/shipping-address/:shippingAddress', shippingAddressRemove, CommonMiddleware.successHandler);
router.put('/user/shipping-address/:shippingAddress', shippingAddressSetDefault, CommonMiddleware.successHandler);
router.get('/user/payment-card', paymentCardList, CommonMiddleware.successHandler);
router.put('/user/payment-card', paymentCardAdd, CommonMiddleware.successHandler);
router.delete('/user/payment-card/:paymentCard', paymentCardRemove, CommonMiddleware.successHandler);
router.put('/user/payment-card/:paymentCard', paymentCardSetDefault, CommonMiddleware.successHandler);
router.get('/user/wish-list', userWishListGet, CommonMiddleware.successHandler);
router.post('/user/wish-list', userWishListPost, CommonMiddleware.successHandler);
router.put('/user/wish-list/:product', userWishListPut, CommonMiddleware.successHandler);
router.delete('/user/wish-list/:product', userWishListDelete, CommonMiddleware.successHandler);
router.get('/user/customer-profile/options', custromerProfileList, CommonMiddleware.successHandler);
router.get('/user/customer-profile', customerProfileGet, CommonMiddleware.successHandler);
router.post('/user/customer-profile', customerProfileSet, CommonMiddleware.successHandler);

router.post('/content', contentList, CommonMiddleware.successHandler);
router.get('/agenda', agendaList, CommonMiddleware.successHandler);

router.get('/brand', brandList, CommonMiddleware.successHandler);
router.get('/collection', collectionListGet, CommonMiddleware.successHandler);
router.post('/collection', collectionListPost, CommonMiddleware.successHandler);
router.get('/product-filter/:key', productFilterList, CommonMiddleware.successHandler);
router.post('/product', productList, CommonMiddleware.successHandler);
router.post('/product/:product/size', productSizeList, CommonMiddleware.successHandler);
router.post('/product-size/:productSize/unavailability', productSizeUnavailability, CommonMiddleware.successHandler);
router.post('/product-size/:productSize/lookup', productSizeLookup, CommonMiddleware.successHandler);
router.put('/product-order', productOrderCreate, CommonMiddleware.successHandler);
router.delete('/product-order/:productOrder', productOrderRelease, CommonMiddleware.successHandler);
router.post('/product-order/:productOrder', productOrderUpdate, CommonMiddleware.successHandler);
router.put('/product-order/:productOrder', productOrderConfirm, CommonMiddleware.successHandler);
router.post('/product-order', productOrderList, CommonMiddleware.successHandler);

router.get('/stylist-tutorial', stylistTutorialList, CommonMiddleware.successHandler);
router.post('/stylist', stylistList, CommonMiddleware.successHandler);
router.put('/stylist-order', stylistBooking, CommonMiddleware.successHandler);
router.post('/stylist-order', stylistOrderList, CommonMiddleware.successHandler);


// Error-handling middleware
router.use(CommonMiddleware.errorHandler);


module.exports = router;