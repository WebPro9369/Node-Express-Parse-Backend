var _ = require('underscore');
var moment = require('moment');
var numeral = require('numeral');

require('./libs/underscore.parse');

var ArmariumError = require('../api/1.0/armarium/error');
var Serializer = require('./libs/serializer');
var UriHelper = require('../api/1.0/helpers/uri');

var AddressEntity = require('../api/1.0/entities/address');
var DateRange = require('../api/1.0/entities/daterange');

var Push = require('./middlewares/push');

var TaxCloud = require('./libs/tax-cloud');
TaxCloud.initialize(process.env.TAXCLOUD_API_ID, process.env.TAXCLOUD_API_KEY, process.env.USPS_USER_ID);

var Stripe = require('./libs/stripe');
Stripe.initialize(process.env.STRIPE_API_KEY);

var CampaignMonitor = require('./libs/campaign-monitor');
CampaignMonitor.initialize(process.env.CAMPAIGN_MONITOR_API_KEY);



////////////////////////////////////////////////////////////////////////////////
// Modules initialization


var serializer = new Serializer({
	_Date			: function (value) {
		return moment.utc(value).format(DATE_FORMAT);
	},
	_DateTimeRange	: function (model, context) {
		
		var date = context.serialize(model.get('orderDate'), '_Date');
		
		var ranges = [];
		ranges.push(_.reduce(model.get('orderTime') || [], function (memo, value) {
			if (!_.isNull(memo)) {
				if (value - memo.till === 1)
					memo.till = value;
				else {
					this.push(memo);
					memo = null;
				}
			}
			if (_.isNull(memo))
				memo = {from: value, till: value};
			return memo;
		}, null, ranges));
		
		var times = _.map(ranges, function (range) {return moment.utc(this).hours(range.from).format(TIME_FORMAT) + ' - ' + moment.utc(this).hours(range.till + 1).format(TIME_FORMAT);}, model.get('orderDate')).join(', ');
		
		return [date, times].join(' / ');
		
	},
	
	User			: {
		fullName				: true
	},
	ShippingAddress	: {
		fullName				: true,
		_formatted				: function (model) {
			return _.compact([(model.get('streetLines') || []).join(' '), model.get('city'), model.get('stateOrProvinceCode'), model.get('postalCode'), model.get('countryCode')]).join(', ');
		}
	},
	
	ProductSize		: {
		id						: true,
		name					: true
	},
	Product			: {
		id						: true,
		name					: true,
		_link					: function (model) {
			var pageCode = model.has('name') ? UriHelper.encode(model.get('name')) : model.id;
			return '<a href="https://www.armarium.com/product/' + pageCode + '" target="_blank">' + (model.get('name') || '&mdash;') + '</a>';
		}
	},
	ProductOrder	: {
		id						: true,
		orderNumber				: true,
		shippingAddress			: 'ShippingAddress',
		user					: 'User',
		product					: 'Product',
		productSize				: 'ProductSize',
		dateFrom				: '_Date',
		dateTill				: '_Date'
	},
	
	Showroom		: {
		id						: true,
		address					: true,
		_formatted				: function (model) {
			
			if (!model.has('address'))
				return;
				
			var value = model.get('address');
			
			return _.compact(
				[
					(value.streetLines || []).join(' ') || '',
					value.city || '',
					value.stateOrProvinceCode || '',
					value.postalCode || '',
					value.countryCode || ''
				]
			)
			.join(', ');
			
		}
	},
	Stylist			: {
		id						: true,
		fullName				: true,
		_link					: function (model) {
			return '<a href="https://www.armarium.com/stylists" target="_blank">' + (model.get('fullName') || '&mdash;') + '</a>';
		}
	},
	StylistOrder	: {
		id						: true,
		orderNumber				: true,
		_orderDateTime			: '_DateTimeRange',
		_location				: function (model, context) {
			
			var res;
			
			if (model.has('shippingAddress')) {
				
				var address = context.serialize(model.get('shippingAddress'), 'ShippingAddress');
				res = _.compact(['In-home', _.has(address, '_formatted') ? address._formatted : null]).join(', ');
			
			} else if (model.has('showroom')) {
				
				var address = context.serialize(model.get('showroom'), 'Showroom');
				res = _.compact(['Showroom', _.has(address, '_formatted') ? address._formatted : null]).join(', ');
				
			}
			
			return res;
			
		},
		user					: 'User',
		stylist					: 'Stylist'
	}
});


////////////////////////////////////////////////////////////////////////////////
// Armarium defines

var
	PAGINATION_LIMIT = 2000;

var
	DATETIME_FORMAT	= 'MMM D, YYYY h:mm A',
	DATE_FORMAT		= 'MMM D, YYYY',
	TIME_FORMAT		= 'h:mm A',
	MONEY_FORMAT	= '$0,0.00',
	NUMBER_FORMAT	= '0,0';

var ARMARIUM_DEFAULT_CURRENCY = 'usd';

var
	SYSTEM_EVENT_TYPE_USER_SIGNED				= 1,
	SYSTEM_EVENT_TYPE_PRODUCT_ORDER_CHARGED		= 2;

var
	TRANSACTION_TYPE_MANUALLY_ENTERED			= 0,
	TRANSACTION_TYPE_BALANCE_USED				= 1,
	TRANSACTION_TYPE_GIFT_WHEN_USER_SIGNED		= 2001,
	TRANSACTION_TYPE_GIFT_WHEN_USER_CHARGED		= 2002,
	TRANSACTION_TYPE_GIFT_WHEN_REFERENT_SIGNED	= 2003,
	TRANSACTION_TYPE_GIFT_WHEN_REFERENT_CHARGED	= 2004;
	
	

var
	ROLE_ADMIN				= 'admin',
	ROLES					= [ROLE_ADMIN];

var
	USER_CONFIRM_AGE_MIN	= 5,
	USER_CONFIRM_AGE_MAX	= 25;

var
	USER_GROUP_VIP			= 'VIP',
	USER_GROUP_FREE			= 'FREE',
	USER_GROUP_FIRST_BORROW	= 'First Borrow',
	USER_GROUP				= [USER_GROUP_VIP, USER_GROUP_FREE];
	

var
	PRODUCT_AVAILABILITY_MIN = {days: 1},
	PRODUCT_AVAILABILITY_MAX = {months: 3};

var 
	STYLIST_AVAILABILITY_MIN = {days: 1},
	STYLIST_AVAILABILITY_MAX = {months: 1};

var
	PRODUCT_DELAY_BEFORE	= 0,
	PRODUCT_DELAY_AFTER		= 0;
	
var
	PRODUCT_RENT_LENGTH_MIN = 4;

var
	PRODUCT_ORDER_DEFAULT_TIC		= '92016',
	PRODUCT_ORDER_DEFAULT_ORIGIN	= {
		streetLines			: ['1 E 52nd St Fl 6'],
		city				: 'New York',
		stateOrProvinceCode	: 'NY',
		postalCode			: '10022-5355',
		countryCode			: 'US'
	};

var
	PRODUCT_ORDER_STATE_LOCKED		= 1,
	PRODUCT_ORDER_STATE_CONFIRMED	= 2,
	PRODUCT_ORDER_STATE_CHARGED		= 3,
	PRODUCT_ORDER_STATE_RETURNED	= 4,
	PRODUCT_ORDER_STATE_DELIVERED	= 5,
	PRODUCT_ORDER_STATE_REJECTED	= 6,
	PRODUCT_ORDER_STATE_CANCELED	= 7,
	PRODUCT_ORDER_STATE_REFUNDED	= 8,
	PRODUCT_ORDER_STATE_TAXCLOUD_LOOKUPED = 9,
	PRODUCT_ORDER_STATE_TAXCLOUD_CAPTURED = 10,
	PRODUCT_ORDER_STATE_TAXCLOUD_RETURNED = 11,
	PRODUCT_ORDER_STATE				= [PRODUCT_ORDER_STATE_LOCKED, PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED, PRODUCT_ORDER_STATE_RETURNED,
										PRODUCT_ORDER_STATE_DELIVERED, PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED, PRODUCT_ORDER_STATE_REFUNDED,
										PRODUCT_ORDER_STATE_TAXCLOUD_LOOKUPED, PRODUCT_ORDER_STATE_TAXCLOUD_CAPTURED, PRODUCT_ORDER_STATE_TAXCLOUD_RETURNED];
	
var
	PRODUCT_DISCOUNT_DEVELOPMENT						= -1,
	PRODUCT_DISCOUNT_FREE_DELIVERY_TO_SAME_ADDRESS		= 1,
	PRODUCT_DISCOUNT_20_OFF_FIRST_BORROW				= 2,
	PRODUCT_DISCOUNT_30_OFF_EVERY_BORROW_FOR_VIP		= 3,
	PRODUCT_DISCOUNT 									= [PRODUCT_DISCOUNT_DEVELOPMENT, PRODUCT_DISCOUNT_FREE_DELIVERY_TO_SAME_ADDRESS, PRODUCT_DISCOUNT_20_OFF_FIRST_BORROW, PRODUCT_DISCOUNT_30_OFF_EVERY_BORROW_FOR_VIP],
	PRODUCT_DISCOUNT_DESCRIPTION						= _.object(
		PRODUCT_DISCOUNT,
		[
			'Development discount',
			'You will have free shipping to same address and dates during next 1 hour',
			'20% off first borrow',
			'30% off every borrow for VIPs'
		]
	);
	
var
	PRODUCT_DISCOUNT_CONDITION_USER_GROUP_IN_LIST		= 1,
	PRODUCT_DISCOUNT_CONDITION_PRODUCT_IN_LIST			= 2,
	PRODUCT_DISCOUNT_CONDITION_FREE_SHIPPING			= 100,
	PRODUCT_DISCOUNT_CONDITION							= [PRODUCT_DISCOUNT_CONDITION_USER_GROUP_IN_LIST, PRODUCT_DISCOUNT_CONDITION_PRODUCT_IN_LIST, PRODUCT_DISCOUNT_CONDITION_FREE_SHIPPING];

var
	PRODUCT_FILTER_BRAND			= 'brand',
	PRODUCT_FILTER_CATEGORY			= 'category',
	PRODUCT_FILTER_SIZE				= 'size',
	PRODUCT_FILTER_PRICE			= 'price',
	PRODUCT_FILTER_DATE				= 'date',
	PRODUCT_FILTER					= [PRODUCT_FILTER_BRAND, PRODUCT_FILTER_CATEGORY, PRODUCT_FILTER_SIZE, PRODUCT_FILTER_PRICE, PRODUCT_FILTER_DATE];

var
	/*PRODUCT_FILTER_ITEMS_CATEGORY	= [
		{value: 'ACCESSORY'									, text: 'ACCESSORY'					, values: ['ACCESSORY']},
-			{value: 'ACCESSORY.GLOVES [ACGL]'				, text: 'GLOVES [ACGL]'				, values: ['ACCESSORY', 'GLOVES [ACGL]']},
			{value: 'ACCESSORY.NECKLACE [ACNK]'				, text: 'NECKLACE [ACNK]'			, values: ['ACCESSORY', 'NECKLACE [ACNK]']},
*			{value: 'ACCESSORY.BAGS'						, text: 'BAGS'						, values: ['ACCESSORY', 'BAGS']},
*			{value: 'ACCESSORY.CLUTCH [ACBC]'				, text: 'CLUTCH [ACBC]'				, values: ['ACCESSORY', 'CLUTCH [ACBC]']},
*			{value: 'ACCESSORY.BAG (NON-CLUTCH) [ACBG]'		, text: 'BAG (NON-CLUTCH) [ACBG]'	, values: ['ACCESSORY', 'BAG (NON-CLUTCH) [ACBG]']},
			{value: 'ACCESSORY.BRACELET [ACBR]'				, text: 'BRACELET [ACBR]'			, values: ['ACCESSORY', 'BRACELET [ACBR]']},
			{value: 'ACCESSORY.BELT [ACBT]'					, text: 'BELT [ACBT]'				, values: ['ACCESSORY', 'BELT [ACBT]']},
			{value: 'ACCESSORY.EARRING [ACER]'				, text: 'EARRING [ACER]'			, values: ['ACCESSORY', 'EARRING [ACER]']},
			{value: 'ACCESSORY.HEADPIECE [ACHD]'			, text: 'HEADPIECE [ACHD]'			, values: ['ACCESSORY', 'HEADPIECE [ACHD]']},
			{value: 'ACCESSORY.RING [ACRG]'					, text: 'RING [ACRG]'				, values: ['ACCESSORY', 'RING [ACRG]']},
		{value: 'BOTTOMS'									, text: 'BOTTOMS'					, values: ['BOTTOMS']},
-			{value: 'BOTTOMS.SHORTS [BSH]'					, text: 'SHORTS [BSH]'				, values: ['BOTTOMS', 'SHORTS [BSH]']},
			{value: 'BOTTOMS.SKIRT [BSK]'					, text: 'SKIRT [BSK]'				, values: ['BOTTOMS', 'SKIRT [BSK]']},
			{value: 'BOTTOMS.TROUSERS [BTR]'				, text: 'TROUSERS [BTR]'			, values: ['BOTTOMS', 'TROUSERS [BTR]']},
		{value: 'TOPS'										, text: 'TOPS'						, values: ['TOPS']},
			{value: 'TOPS.LONG SLEEVE TOP [TLS]'			, text: 'LONG SLEEVE TOP [TLS]'		, values: ['TOPS', 'LONG SLEEVE TOP [TLS]']},
			{value: 'TOPS.SHORT SLEEVE TOP [TSS]'			, text: 'SHORT SLEEVE TOP [TSS]'	, values: ['TOPS', 'SHORT SLEEVE TOP [TSS]']},
			{value: 'TOPS.VEST TOP [TVS]'					, text: 'VEST TOP [TVS]'			, values: ['TOPS', 'VEST TOP [TVS]']},
			{value: 'TOPS.LONG SLEEVE KNIT [KNL]'			, text: 'LONG SLEEVE KNIT [KNL]'	, values: ['TOPS', 'LONG SLEEVE KNIT [KNL]']},
			{value: 'TOPS.SHORT SLEEVE KNIT [KNS]'			, text: 'SHORT SLEEVE KNIT [KNS]'	, values: ['TOPS', 'SHORT SLEEVE KNIT [KNS]']},
		{value: 'DRESSES'									, text: 'DRESSES'					, values: ['DRESSES']},
			{value: 'DRESSES.SHORT HEM DRESS [DRS]'			, text: 'SHORT HEM DRESS [DRS]'		, values: ['DRESSES', 'SHORT HEM DRESS [DRS]']},
			{value: 'DRESSES.MIDI HEM DRESS [DRM]'			, text: 'MIDI HEM DRESS [DRM]'		, values: ['DRESSES', 'MIDI HEM DRESS [DRM]']},
			{value: 'DRESSES.LONG HEM DRESS [DRL]'			, text: 'LONG HEM DRESS [DRL]'		, values: ['DRESSES', 'LONG HEM DRESS [DRL]']},
		{value: 'GOWNS'										, text: 'GOWNS'						, values: ['GOWNS']},
			{value: 'GOWNS.LONG SLEEVE GOWN [GLS]'			, text: 'LONG SLEEVE GOWN [GLS]'	, values: ['GOWNS', 'LONG SLEEVE GOWN [GLS]']},
			{value: 'GOWNS.SHORT SLEEVE GOWN [GSS]'			, text: 'SHORT SLEEVE GOWN [GSS]'	, values: ['GOWNS', 'SHORT SLEEVE GOWN [GSS]']},
*		{value: 'JUMPSUIT-ROMPERS [JMP]'					, text: 'JUMPSUIT-ROMPERS [JMP]'	, values: ['JUMPSUIT-ROMPERS [JMP]']},
*		{value: 'CAPES/PONCHOS [CPPO]'						, text: 'CAPES/PONCHOS [CPPO]'		, values: ['CAPES/PONCHOS [CPPO]']},
		{value: 'OUTERWEAR'									, text: 'OUTERWEAR'					, values: ['OUTERWEAR']},
-			{value: 'OUTERWEAR.COATS [OCT]'					, text: 'COATS [OCT]'				, values: ['OUTERWEAR', 'COATS [OCT]']},
			{value: 'OUTERWEAR.FURS [OFR]'					, text: 'FURS [OFR]'				, values: ['OUTERWEAR', 'FURS [OFR]']},
			{value: 'OUTERWEAR.JACKETS [OJK]'				, text: 'JACKETS [OJK]'				, values: ['OUTERWEAR', 'JACKETS [OJK]']}
	];*/
	PRODUCT_FILTER_ITEMS_CATEGORY	= [
		{value: 'HANDBAGS'									, text: 'HANDBAGS'					, values: ['HANDBAGS']},
			{value: 'HANDBAGS.BAG (NON-CLUTCH) [ACBG]'		, text: 'BAG (NON-CLUTCH) [ACBG]'	, values: ['HANDBAGS', 'BAG (NON-CLUTCH) [ACBG]']},
			{value: 'HANDBAGS.CLUTCH [ACBC]'				, text: 'CLUTCH [ACBC]'				, values: ['HANDBAGS', 'CLUTCH [ACBC]']},
		{value: 'ACCESSORIES'								, text: 'ACCESSORIES'				, values: ['ACCESSORIES']},
			{value: 'ACCESSORIES.BRACELET [ACBR]'			, text: 'BRACELET [ACBR]'			, values: ['ACCESSORIES', 'BRACELET [ACBR]']},
			{value: 'ACCESSORIES.EARRING [ACER]'			, text: 'EARRING [ACER]'			, values: ['ACCESSORIES', 'EARRING [ACER]']},
			{value: 'ACCESSORIES.NECKLACE [ACNK]'			, text: 'NECKLACE [ACNK]'			, values: ['ACCESSORIES', 'NECKLACE [ACNK]']},
			{value: 'ACCESSORIES.RING [ACRG]'				, text: 'RING [ACRG]'				, values: ['ACCESSORIES', 'RING [ACRG]']},
			{value: 'ACCESSORIES.BELT [ACBT]'				, text: 'BELT [ACBT]'				, values: ['ACCESSORIES', 'BELT [ACBT]']},
			{value: 'ACCESSORIES.HEADPIECE [ACHD]'			, text: 'HEADPIECE [ACHD]'			, values: ['ACCESSORIES', 'HEADPIECE [ACHD]']},
		{value: 'JUMPSUITS'									, text: 'JUMPSUITS'					, values: ['JUMPSUITS']},
			{value: 'JUMPSUITS.JUMPSUIT-ROMPERS [JMP]'		, text: 'JUMPSUIT-ROMPERS [JMP]'	, values: ['JUMPSUITS', 'JUMPSUIT-ROMPERS [JMP]']},
		{value: 'DRESSES'									, text: 'DRESSES'					, values: ['DRESSES']},
			{value: 'DRESSES.LONG HEM DRESS [DRL]'			, text: 'LONG HEM DRESS [DRL]'		, values: ['DRESSES', 'LONG HEM DRESS [DRL]']},
			{value: 'DRESSES.MIDI HEM DRESS [DRM]'			, text: 'MIDI HEM DRESS [DRM]'		, values: ['DRESSES', 'MIDI HEM DRESS [DRM]']},
			{value: 'DRESSES.SHORT HEM DRESS [DRS]'			, text: 'SHORT HEM DRESS [DRS]'		, values: ['DRESSES', 'SHORT HEM DRESS [DRS]']},
		{value: 'GOWNS'										, text: 'GOWNS'						, values: ['GOWNS']},
			{value: 'GOWNS.SHORT SLEEVE GOWN [GSS]'			, text: 'SHORT SLEEVE GOWN [GSS]'	, values: ['GOWNS', 'SHORT SLEEVE GOWN [GSS]']},
			{value: 'GOWNS.LONG SLEEVE GOWN [GLS]'			, text: 'LONG SLEEVE GOWN [GLS]'	, values: ['GOWNS', 'LONG SLEEVE GOWN [GLS]']},
		{value: 'OUTERWEAR'									, text: 'OUTERWEAR'					, values: ['OUTERWEAR']},
			{value: 'OUTERWEAR.JACKETS [OJK]'				, text: 'JACKETS [OJK]'				, values: ['OUTERWEAR', 'JACKETS [OJK]']},
			{value: 'OUTERWEAR.FURS [OFR]'					, text: 'FURS [OFR]'				, values: ['OUTERWEAR', 'FURS [OFR]']},
		{value: 'TOPS'										, text: 'TOPS'						, values: ['TOPS']},
			{value: 'TOPS.CAPES/PONCHOS [CPPO]'				, text: 'CAPES/PONCHOS [CPPO]'		, values: ['TOPS', 'CAPES/PONCHOS [CPPO]']},
			{value: 'TOPS.LONG SLEEVE TOP [TLS]'			, text: 'LONG SLEEVE TOP [TLS]'		, values: ['TOPS', 'LONG SLEEVE TOP [TLS]']},
			{value: 'TOPS.SHORT SLEEVE KNIT [KNS]'			, text: 'SHORT SLEEVE KNIT [KNS]'	, values: ['TOPS', 'SHORT SLEEVE KNIT [KNS]']},
			{value: 'TOPS.LONG SLEEVE KNIT [KNL]'			, text: 'LONG SLEEVE KNIT [KNL]'	, values: ['TOPS', 'LONG SLEEVE KNIT [KNL]']},
			{value: 'TOPS.VEST TOP [TVS]'					, text: 'VEST TOP [TVS]'			, values: ['TOPS', 'VEST TOP [TVS]']},
			{value: 'TOPS.SHORT SLEEVE TOP [TSS]'			, text: 'SHORT SLEEVE TOP [TSS]'	, values: ['TOPS', 'SHORT SLEEVE TOP [TSS]']},
		{value: 'BOTTOMS'									, text: 'BOTTOMS'					, values: ['BOTTOMS']},
			{value: 'BOTTOMS.TROUSERS [BTR]'				, text: 'TROUSERS [BTR]'			, values: ['BOTTOMS', 'TROUSERS [BTR]']},
			{value: 'BOTTOMS.SKIRT [BSK]'					, text: 'SKIRT [BSK]'				, values: ['BOTTOMS', 'SKIRT [BSK]']}
	];

var
	PRODUCT_FILTER_ITEMS_SIZE		= [
		{value: '0'			, text: 'US 0'},
		{value: '2'			, text: 'US 2'},
		{value: '4'			, text: 'US 4'},
		{value: '6'			, text: 'US 6'},
		{value: '8'			, text: 'US 8'},
		{value: '10'		, text: 'US 10'}
	];

var
	PRODUCT_FILTER_ITEMS_PRICE		= [
		{value: '-75'		, text: 'Less than $75'				, till: 75},
		{value: '75-250'	, text: '$75 to $250'	, from: 75	, till: 250},
		{value: '250-500'	, text: '$250 to $500'	, from: 250	, till: 500},
		{value: '500-750'	, text: '$500 to $750'	, from: 500	, till: 750},
		{value: '750-'		, text: '$750 +'		, from: 750}
	];

var
	STYLIST_ORDER_STATE_LOCKED		= 1,
	STYLIST_ORDER_STATE_CONFIRMED	= 2,
	STYLIST_ORDER_STATE_CHARGED		= 3,
	STYLIST_ORDER_STATE_REJECTED	= 4,
	STYLIST_ORDER_STATE_CANCELED	= 5,
	STYLIST_ORDER_STATE_APPROVED	= 6,
	STYLIST_ORDER_STATE_REFUNDED	= 7,
	STYLIST_ORDER_STATE_BOOKED		= 8,
	STYLIST_ORDER_STATE				= [STYLIST_ORDER_STATE_LOCKED, STYLIST_ORDER_STATE_CONFIRMED, STYLIST_ORDER_STATE_CHARGED, STYLIST_ORDER_STATE_REJECTED,
										STYLIST_ORDER_STATE_CANCELED, STYLIST_ORDER_STATE_APPROVED, STYLIST_ORDER_STATE_REFUNDED, STYLIST_ORDER_STATE_BOOKED];

var
	STYLIST_TYPE_STAR				= 1,
	STYLIST_TYPE_INHOME				= 2,
	STYLIST_TYPE					= [STYLIST_TYPE_STAR, STYLIST_TYPE_INHOME];
	
var
	STYLIST_GENDER_HE				= 1,
	STYLIST_GENDER_SHE				= 2,
	STYLIST_GENDER_THEY				= 3,
	STYLIST_GENDER					= [STYLIST_GENDER_HE, STYLIST_GENDER_SHE, STYLIST_GENDER_THEY];

var
	STYLIST_LOOKUP_RADIUS			= 500.0;
	
var
	STYLIST_GENDER_TITLE			= _.object(
		STYLIST_GENDER,
		['He', 'She', 'They']
	);

var
	PRODUCT_ORDER_LOCK_TIME = {minutes: 10},
	STYLIST_ORDER_LOCK_TIME = {minutes: 3};

var
	PUSH_NOTIFICATION_TYPE_USER_CONFIRMED					= 100,
	PUSH_NOTIFICATION_TYPE_COLLECTION_PUBLISHED				= 200,
	PUSH_NOTIFICATION_TYPE_STYLIST_PUBLISHED				= 201,
	PUSH_NOTIFICATION_TYPE_PRODUCT_ORDER_RETURN_TOMORROW	= 300,
	PUSH_NOTIFICATION_TYPE_PRODUCT_ORDER_OVERDUE			= 301,
	PUSH_NOTIFICATION_TYPE = [PUSH_NOTIFICATION_TYPE_USER_CONFIRMED, PUSH_NOTIFICATION_TYPE_COLLECTION_PUBLISHED, PUSH_NOTIFICATION_TYPE_STYLIST_PUBLISHED, PUSH_NOTIFICATION_TYPE_PRODUCT_ORDER_RETURN_TOMORROW, PUSH_NOTIFICATION_TYPE_PRODUCT_ORDER_OVERDUE];

var PUSH_NOTIFICATION_TEMPLATE = _.object(
	PUSH_NOTIFICATION_TYPE,
	[
		// PUSH_NOTIFICATION_TYPE_USER_CONFIRMED
		'Congratulations, you just received the key to unlock high fashion looks on a borrowed basis at Armarium.\n' +
		'You are invited to shop a curated selection of statement looks from the likes of Roberto Cavalli, Mugler, Sonia Rykiel, ETRO, Anthony Vaccarello, and Marchesa, amongst many more! See style picks from star stylists such as Karla Martinez de Salas, formerly of W Magazine. Get access to a network of our exclusive Style Brigade to create your best look.',
		
		// PUSH_NOTIFICATION_TYPE_COLLECTION_PUBLISHED
		'Check out our latest Collection, <%= name %>, to take you through the latest trends.',
		
		// PUSH_NOTIFICATION_TYPE_STYLIST_PUBLISHED
		'Welcome to our newest addition to the Style Brigade, <%= fullName %>.<% if (gender && !_.isEmpty(previousJob)) { %> <%= genderTitle %> join<% if (_.contains([1, 2], gender)) { %>s<% } %> us from the ranks of <%= previousJob.join(" and ") %>.<% } %>\n' +
		'To book a session with <%= fullName %> today, click here.\n' +
		'Xoxo, Look forward to styling you soon.',
		
		// PUSH_NOTIFICATION_TYPE_PRODUCT_ORDER_RETURN_TOMORROW
		'Hope you had an amazing event! We are sure you looked fantastic!\n' +
		'This is just a reminder to pop your package back in the mail today. Please use the return label we provided to you. All the instructions were included in your package, but if you have any questions, feel free to call us at (646)580-7464 or email us at care@armarium.com',
		
		// PUSH_NOTIFICATION_TYPE_PRODUCT_ORDER_OVERDUE
		'Hangover killing you? We understand…\n' +
		'But would you mind dragging yourself out of bed to return your package? It is overdue and we don’t want to add to your headache…\n' +
		'*$50 late fee is assessed on your credit card for each day you are overdue.'
	]
);

var
	CM_NOTIFICATION_TYPE_PRODUCT_ORDER_CONFIRMED		= '8a0b89f9-b16f-4645-b546-d666100d340c',
	CM_NOTIFICATION_TYPE_STYLIST_ORDER_CONFIRMED		= '7caa7607-14ca-4c60-aaeb-9e5a3b9e24f3';
	
var
	CM_PRODUCT_ORDER_BCC	= 'orders@armarium.com',
	CM_STYLIST_ORDER_BCC	= 'stylist@armarium.com';


////////////////////////////////////////////////////////////////////////////////
// Triggers


// _User before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave(Parse.User, function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= [],
		required	= ['phoneNumber'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if ((isNew && request.object.has('confirmed')) || (!isNew && !request.master && request.object.dirty('confirmed')))
		return response.error('Changing some attributes prohibited');
	
	if ((isNew && request.object.has('group')) || (!isNew && !request.master && request.object.dirty('group')))
		return response.error('Changing some attributes prohibited');
		
	if ((isNew && request.object.has('sharedLink')) || (!isNew && !request.master && request.object.dirty('sharedLink')))
		return response.error('Changing some attributes prohibited');
	
	if ((isNew && request.object.has('referrer')) || (!isNew && !request.master && request.object.dirty('referrer')))
		return response.error('Changing some attributes prohibited');
		
	if ((isNew && request.object.has('balance')) || (!isNew && !request.master && request.object.dirty('balance')))
		return response.error('Changing some attributes prohibited');
	
	if (request.object.has('balance') && request.object.get('balance') < 0)
		return response.error('Account balance cannot be negative');
	
	/*if (isNew)
		request.object.addUnique('group', USER_GROUP_FIRST_BORROW);*/
	
	//if (!isNew && request.object.dirty('confirmed') && request.object.get('confirmed') === true) {
	
	var promises = [];
	
	/*promises.push(
		
		notificationSend(PUSH_NOTIFICATION_TYPE_USER_CONFIRMED, request.object)
	
	);*/
	
	promises.push(
		
		CampaignMonitor.Subscribers.create(
			
			process.env.CAMPAIGN_MONITOR_LIST_REGISTERED_USERS,
			{
				
				EmailAddress							: request.object.get('username'),
				Name									: request.object.get('fullName') || '',
				
				Resubscribe								: true,
				RestartSubscriptionBasedAutoresponders	: true
				
			}
			
		)
	
	);
	
	Parse.Promise.when(promises).then(
		
		function () {
			response.success();
		},
		function () {
			response.success();
		}
		
	);
	
	/*} else
		response.success();*/
	
});


Parse.Cloud.afterSave(Parse.User, function(request) {
	
	if (!request.object.existed())
		return processSystemEvent(SYSTEM_EVENT_TYPE_USER_SIGNED, request.object);
	
});


// SystemEvent before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('SystemEvent', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['description'],
		required	= ['type'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// Transaction before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('Transaction', function(request, response) {
	
	var
		isNew = request.object.isNew();
	
	if (!isNew && request.object.dirty())
		return response.error('Changing some attributes prohibited');
	
	if (!request.master && request.object.dirty())
		return response.error('Changing some attributes prohibited');
	
	if (!(request.object.has('user') && request.object.has('type') && request.object.has('value')))
		return response.error('Some attributes is required');
	
	Parse.Promise.as().then(
		
		function () {
			
			var user = request.object.get('user');
			
			user.increment('balance', request.object.get('value'));
			
			return user.save(null, {useMasterKey: true});
			
		}
		
	).then(
		
		function () {
			response.success();
		},
		function (error) {
			response.error(error.message);
		}
		
	);
	
});


// UserGroup before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('UserGroup', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['name', 'description'],
		required	= [],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// Agenda before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('Agenda', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['thumbTitle', 'thumbSubtitle', 'boxTitle', 'boxSubtitle', 'title', 'subtitle', 'text', 'browseTitle', 'browseSubtitle'],
		required	= [],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// Content before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('Content', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['key', 'description', 'textValue'],
		required	= ['key'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// CustomerProfile before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('CustomerProfile', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['key', 'title', 'note'],
		required	= ['key'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// ShippingAddress before save trigger
//	- validate
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('ShippingAddress', function(request, response) {
	
	var
		now			= moment.utc();
	
	if (request.object.dirty('removed') && request.object.get('removed') === true)
		request.object.set('removedAt', now.toDate());
	
	response.success();
	
});


// PaymentCard before save trigger
//	- validate
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('PaymentCard', function(request, response) {
	
	var
		now			= moment.utc();
	
	if (request.object.dirty('removed') && request.object.get('removed') === true)
		request.object.set('removedAt', now.toDate());
	
	response.success();
	
});


// Brand before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('Brand', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['name', 'brandDescription'],
		required	= ['name'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// Collection before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('Collection', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['name', 'subtitle', 'collectionDescription', 'seasonDescription'],
		required	= ['name'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	if (request.object.get('private') !== true && request.object.dirty('published') && request.object.get('published') === true && !request.object.has('notificatedAt'))
		request.object.set('notificatedAt', now.toDate());
	
	response.success();
	
});


// Collection after save trigger
//	- send notification
Parse.Cloud.afterSave('Collection', function(request) {
	
	var
		now			= moment.utc();
		
	if (
		request.object.get('private') !== true &&
		request.object.get('published') === true &&
		request.object.has('notificatedAt') &&
		now.diff(moment.utc(request.object.get('notificatedAt')), 'seconds') <= 60
	) {
	
		var data = _.defaults(
			request.object.toJSON(),
			{
				name					: '',
				subtitle				: '',
				collectionDescription	: '',
				seasonDescription		: ''
			}
		);
		
		notificationSend(PUSH_NOTIFICATION_TYPE_COLLECTION_PUBLISHED, new Parse.Query(Parse.Installation), data, request.object.id);
		
	}
	
});


// Product before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('Product', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['name', 'details', 'styleNote', 'styleCode', 'color', 'category1', 'category2'],
		required	= ['name'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	if (request.object.dirty('price')) {
		
		var price = request.object.get('price');
		
		var priceRange = _
			.chain(PRODUCT_FILTER_ITEMS_PRICE)
			.filter(function (priceFilter) {
				
				if (_.isUndefined(price))
					return false;
				
				if (_.has(priceFilter, 'from') && _.has(priceFilter, 'till'))
					return (priceFilter.from <= price && price < priceFilter.till);
				
				else if (_.has(priceFilter, 'from'))
					return (priceFilter.from <= price);
					
				else if (_.has(priceFilter, 'till'))
					return (price < priceFilter.till);
				
				return false;
				
			})
			.map(function (priceFilter) {
				return priceFilter.value;
			})
			.value();
		
		if (!_.isEmpty(priceRange))
			request.object.set('priceRange', priceRange);
			
		else
			request.object.unset('priceRange');
		
	}
	
	if (request.object.dirty('category1') || request.object.dirty('category2')) {
		
		var
			category1 = request.object.get('category1'),
			category2 = request.object.get('category2');
		
		var categories = _
			.chain(PRODUCT_FILTER_ITEMS_CATEGORY)
			.filter(function (categoryFilter) {
				return ((categoryFilter.values[0] === category1 && !_.has(categoryFilter.values, 1)) || (categoryFilter.values[0] === category1 && categoryFilter.values[1] === category2));
			})
			.map(function (categoryFilter) {
				return categoryFilter.value;
			})
			.value();
		
		if (!_.isEmpty(categories))
			request.object.set('categories', categories);
			
		else
			request.object.unset('categories');
		
	}
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// ProductDiscount before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('ProductDiscount', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['title', 'description', 'note'],
		required	= ['title'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// Showroom before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('Showroom', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['name', 'address'],
		required	= ['name'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// StylistTutorial before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('StylistTutorial', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['name', 'details'],
		required	= [],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	response.success();
	
});


// Stylist before save trigger
//	- validate
//	- set defaults
//	- re-index
// Class ACL:
//	public	- get, find
//	admin	- get, find, create, update
Parse.Cloud.beforeSave('Stylist', function(request, response) {
	
	var
		now			= moment.utc(),
		indexed		= ['fullName', 'details'],
		required	= ['fullName'],
		restricted	= [],
		defaults	= {};
	
	var
		isNew = request.object.isNew();
	
	if (error = _.validateObject(request.object, required, restricted))
		return response.error(error);
	
	if (isNew)
		_.bindDefaults(request.object, defaults);
	
	var
		reIndex = request.object.dirty('indexedAt') || request.object.dirty('searchable') || _.checkReIndex(request.object, indexed);
		
	if (isNew || reIndex) {
		request.object.set('searchable', _.reIndex(request.object, indexed));
		request.object.set('indexedAt', now.toDate());
	}
	
	if (request.object.dirty('published') && request.object.get('published') === true && !request.object.has('notificatedAt'))
		request.object.set('notificatedAt', now.toDate());
	
	if (request.object.dirty('zip') || request.object.dirty('location')) {
		
		if (request.object.has('zip')) {
			
			var query = new Parse.Query('ZipGeoPoint');
			query.equalTo('code', request.object.get('zip'));
			return query.first(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				function (zgp) {
					
					if (zgp instanceof Parse.Object) {
						
						request.object.set('location', zgp.get('location'));
						response.success();
						
					} else
						response.error('Zip-code is not valid');
					
				}
				
			);
			
		} else if (request.object.has('location'))
			request.object.unset('location');
		
	}
	
	response.success();
	
});


// Stylist after save trigger
//	- send notification
Parse.Cloud.afterSave('Stylist', function(request) {
	
	var
		now			= moment.utc();
		
	if (
		request.object.get('type') === STYLIST_TYPE_STAR &&
		request.object.get('published') === true &&
		request.object.has('notificatedAt') &&
		now.diff(moment.utc(request.object.get('notificatedAt')), 'seconds') <= 60
	) {
		
		var data = _.defaults(
			request.object.toJSON(),
			{
				fullName				: '',
				details					: '',
				gender					: 0,
				genderTitle				: STYLIST_GENDER_TITLE[request.object.get('gender')] || '',
				previousJob				: []
			}
		);
	
		notificationSend(PUSH_NOTIFICATION_TYPE_STYLIST_PUBLISHED, new Parse.Query(Parse.Installation), data, request.object.id)
		
	}
	
});



////////////////////////////////////////////////////////////////////////////////
// BACKEND TODO



// userResubscribe
// Output:
//	Array
Parse.Cloud.define('userResubscribe', function(request, response) {
	
	Parse.Promise.as().then(
		
		/*function () {
			
			return CampaignMonitor.Subscribers.remove(
				
				process.env.CAMPAIGN_MONITOR_LIST_REGISTERED_USERS,
				request.params.username
			
			);
		
		}
	
	).then(*/
		
		function () {
			
			return CampaignMonitor.Subscribers.create(
				
				process.env.CAMPAIGN_MONITOR_LIST_REGISTERED_USERS,
				{
					
					EmailAddress							: request.params.username,
    				Name									: request.params.fullName,
    				
					Resubscribe								: true,
    				RestartSubscriptionBasedAutoresponders	: true
					
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString(true) : error.message);
		}
		
	);
	
});


// nextSortOrder - return next sort order for specified class
//Input:
//	className		 : String
//	parentKey
//	parentValue
//Output:
//	Number
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
Parse.Cloud.define('nextSortOrder', function(request, response) {
	
	if (!(_.requestParamExists(request, 'className') && _.contains(['CustomerProfile', 'Agenda', 'Brand', 'Collection', 'Product', 'StylistTutorial', 'Stylist'], request.params.className)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'className'}).toString(true));
	
	Parse.Promise.as().then(
		
		function () {
		
			var query = new Parse.Query(request.params.className);
			
			if (_.requestParamExists(request, 'parentKey') && _.requestParamExists(request, 'parentValue')) {
				query.equalTo(request.params.parentKey, request.params.parentValue);
			}
			
			query.select(['sortOrder'])
			query.exists('sortOrder');
			query.descending('sortOrder');
			
			return query.first(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
		}
	
	).then(
		
		function (result) {
			response.success(result instanceof Parse.Object ? result.get('sortOrder') + 1 : 0);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString(true) : error.message);
		}
		
	);
	
});


// userRoleList - return user roles
// Output:
//	Array
Parse.Cloud.define('userRoleList', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.success([]);
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query(Parse.Role);
			query.select(['name'])
			query.equalTo('users', request.user);
			return query.find({useMasterKey: true});
		
		}
	
	).then(
		
		function (result) {
			response.success(_.map(result, function (item) {return item.get('name');}));
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString(true) : error.message);
		}
		
	);
	
});


// userConfirm - confirm user
//Input:
//	user : Id						- User Id
//Output:
//	Boolean							- current value of confirmation
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
//	ACCESS_DENIED
//	USER_IS_NOT_AVAILABLE
//	USER_UPDATE_FAILED
Parse.Cloud.define('userConfirm', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.ACCESS_DENIED).toString(true));
	
	if (!(_.requestParamExists(request, 'user') && _.isParseId(request.params.user)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'user'}).toString(true));
		
	checkUserRole(request.user, ROLE_ADMIN).then(
		
		function () {
			
			var query = new Parse.Query(Parse.User);
			return query.get(request.params.user, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
		
	).then(
		
		function (user) {
			
			user.set('confirmed', request.params.value === true);
			
			return user.save(null, {useMasterKey: true}).then(
				
				null,
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (user) {
			response.success(user.get('confirmed'));
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString(true) : error.message);
		}
		
	);
	
});


// transactionCreate - create transaction
//Input:
//	user			: Id (required)				- User Id
//	value			: Number (required)
//Output:
//	Boolean										- true if changed
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
//	ACCESS_DENIED
//	USER_IS_NOT_AVAILABLE
//	TRANSACTION_CREATE_FAILED
Parse.Cloud.define('transactionCreate', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.ACCESS_DENIED).toString(true));
	
	if (!(_.requestParamExists(request, 'user') && _.isParseId(request.params.user)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'user'}).toString(true));
	
	if (!(_.requestParamExists(request, 'value') && _.isNumber(request.params.value)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'value'}).toString(true));
	
	checkUserRole(request.user, ROLE_ADMIN).then(
		
		function () {
			
			var query = new Parse.Query(Parse.User);
			return query.get(request.params.user, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
		
	).then(
		
		function (user) {
			
			var transaction = new Parse.Object('Transaction');
			
			transaction.set('user', user);
			transaction.set('type', TRANSACTION_TYPE_MANUALLY_ENTERED);
			transaction.set('value', request.params.value);
				
			return transaction.save(null, {useMasterKey: true}).then(
				
				function () {
					return Parse.Promise.as(true);
				},
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.TRANSACTION_CREATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString(true) : error.message);
		}
		
	);
	
});


// userGroupUpdate - change user group
//Input:
//	user			: Id						- User Id
//	group			: Array
//Output:
//	Boolean										- true if changed
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
//	ACCESS_DENIED
//	USER_IS_NOT_AVAILABLE
//	USER_UPDATE_FAILED
Parse.Cloud.define('userGroupUpdate', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.ACCESS_DENIED).toString(true));
	
	if (!(_.requestParamExists(request, 'user') && _.isParseId(request.params.user)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'user'}).toString(true));
	
	checkUserRole(request.user, ROLE_ADMIN).then(
		
		function () {
			
			var promises = [];
			
			var query = new Parse.Query(Parse.User);
			promises.push(query.get(request.params.user, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_IS_NOT_AVAILABLE));
				}
				
			));
			
			var query = new Parse.Query('UserGroup');
			query.select(['name']);
			query.exists('name');
			query.containedIn('name', request.params.group);
			promises.push(query.find({useMasterKey: true}));
			
			return Parse.Promise.when(promises);
			
		}
		
	).then(
		
		function (result) {
			
			user = result[0];
			groups = result[1];
			
			var
				before = user.get('group'),
				after = _.map(groups, function (group) {return group.get('name');});
			
			if (_.equal(before, after))
				return Parse.Promise.as(false);
			
			if (!_.isEmpty(after))
				user.set('group', after);
			
			else
				user.unset('group');
				
			return user.save(null, {useMasterKey: true}).then(
				
				function () {
					return Parse.Promise.as(true);
				},
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString(true) : error.message);
		}
		
	);
	
});



////////////////////////////////////////////////////////////////////////////////
// CONTENT TODO


// agendaList - return agenda list
//Input:
//Output:
//	Agenda[]
//Exceptions:
Parse.Cloud.define('agendaList', function(request, response) {
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('Agenda');
			query.include(['thumbImage', 'listImage', 'coverImage', 'bannerImage', 'gridImage', 'gridBottomImage', 'browseImage']);
			query.exists('title');
			query.equalTo('published', true);
			query.ascending('sortOrder');
			query.limit(PAGINATION_LIMIT);
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
		
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// contentList - return static content list
//Input:
//	node		: Number		- Content node, will be limit result to specific node id specified
//	key			: String		- Key for matching (key will be matched by startsWith constraint)
//Output:
//	Content[]
//Exceptions:
Parse.Cloud.define('contentList', function(request, response) {
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('Content');
			query.select(['key', 'index', 'type', 'textValue', 'fileValue']);
			if (_.requestParamExists(request, 'node'))
				query.equalTo('node', request.params.node);
			if (_.requestParamExists(request, 'key'))
				query.startsWith('key', request.params.key);
			query.limit(PAGINATION_LIMIT);
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
		
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// headStylingCollection - return first collection and stylist tutorial images
//Input:
//Output:
//	styling		: Image
//	collection	: Image
//Exceptions:
Parse.Cloud.define('headStylingCollection', function(request, response) {
	
	return Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
					
			var query = new Parse.Query('Collection');
			
			query.include(['preview']);
			query.exists('preview');
			query.equalTo('published', true);
			query.ascending('sortOrder');
			
			promises.push(query.first(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			var query = new Parse.Query('StylistTutorial');

			query.include(['preview']);
			query.exists('preview');
			query.equalTo('published', true);
			query.ascending('sortOrder');

			promises.push(query.first(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			collection = result[0];
			stylistTutorial = result[1];
			response.success({collection: (collection instanceof Parse.Object) && collection.has('preview') ? collection.get('preview').toJSON() : null, styling: (stylistTutorial instanceof Parse.Object) && stylistTutorial.has('preview') ? stylistTutorial.get('preview').toJSON() : null});
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// custromerProfileList - return customer profile option list
//Input:
//Output:
//	CustromerProfile[]
//Exceptions:
Parse.Cloud.define('custromerProfileList', function(request, response) {
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('CustomerProfile');
			
			query.equalTo('published', true);
			query.ascending('sortOrder');
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
		
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);	
	
});


// customerProfileGet - return customer profile
//Input:
//Output:
//						: Object			- Customer profile values
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
Parse.Cloud.define('customerProfileGet', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	Parse.Promise.as().then(
		
		function () {
			response.success(request.user.get('customerProfile') || []);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// customerProfileSet - update customer profile
//Input:
//	customerProfile		: Object			- Customer profile values
//Output:
//						: Boolean			- True if success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_VALID
//	USER_UPDATE_FAILED
Parse.Cloud.define('customerProfileSet', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'customerProfile') && _.isObject(request.params.customerProfile)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_VALID, null, {name: 'customerProfile'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('CustomerProfile');
			
			query.equalTo('published', true);
			query.ascending('sortOrder');
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
	
	).then(
		
		function (options) {
			
			var availableKeys = _.chain(options).map(function (option) {return option.get('key');}).compact().value();
			
			if (!_.isEmpty(_.difference(_.keys(request.params.customerProfile), availableKeys)))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_VALID, null, {name: 'customerProfile'}).toString());
				
			request.user.set('customerProfile', request.params.customerProfile);
			
			return request.user.save(null, {useMasterKey: true}).then(
				
				null,
				function (error) {
					console.log(error.message)
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(result instanceof Parse.User ? true : false);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});



////////////////////////////////////////////////////////////////////////////////
// PROFILE TODO


// userGet - return current user information
//Input:
//Output:
//	User
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
Parse.Cloud.define('userGet', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	response.success(request.user);
	
});


// userUpdate - update current user information
//Input:
//	fullName			: String - Full Name
//	phoneNumber			: String - Phone
//	zipcode				: String - ZIP-code
//Output:
//	User
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	USER_UPDATE_FAILED
Parse.Cloud.define('userUpdate', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (_.requestParamExists(request, 'fullName'))
		request.user.set('fullName', request.params.fullName);
	
	if (_.requestParamExists(request, 'phoneNumber'))
		request.user.set('phoneNumber', request.params.phoneNumber);
	
	if (_.requestParamExists(request, 'zipcode'))
		request.user.set('zipcode', request.params.zipcode);
		
	var promise = Parse.Promise.as();
	
	if (request.user.dirty())
		
		promise = promise.then(
			
			function () {
				
				return request.user.save(null, {useMasterKey: true}).then(
					
					null,
					function (error) {
						console.log(error.message)
						return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
					}
					
				);
				
			}
			
		);
		
	promise.then(
		
		function () {
			response.success(request.user);
		},
		function (error) {
			console.log(error.message)
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	)
	
});


// userLinkAdd - register shared link
//Input:
//	uid				: String			- shared link uid
//Output:
//	Boolean
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	USER_UPDATE_FAILED
Parse.Cloud.define('userLinkAdd', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!_.requestParamExists(request, 'uid'))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'uid'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			if (_.contains(request.user.get('sharedLink'), request.params.uid))
				return Parse.Promise.as(null);
			
			request.user.addUnique('sharedLink', String(request.params.uid).toUpperCase());
			
			return request.user.save(null, {useMasterKey: true}).then(
				
				null,
				function (error) {
					console.log(error.message)
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(result instanceof Parse.User ? true : false);
		},
		function (error) {
			console.log(error.message)
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// userLinkCheck - check shared link
//Input:
//	uid				: String			- shared link uid
//Output:
//	Boolean
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	USER_UPDATE_FAILED
Parse.Cloud.define('userLinkCheck', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!_.requestParamExists(request, 'uid'))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'uid'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query(Parse.User);
			query.equalTo('sharedLink', String(request.params.uid).toUpperCase());
			
			return query.first(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
		
		}
	
	).then(
		
		function (user) {
			
			if (!(user instanceof Parse.User))
				return Parse.Promise.as(false);
			
			request.user.set('referrer', user);
			
			return request.user.save(null, {useMasterKey: true}).then(
				
				/*function (user) {
					
					return Parse.Promise.as(true);
					return processSystemEvent(SYSTEM_EVENT_TYPE_REFERRER_ASSIGNED, user);
					
				}*/
				null,
				function (error) {
					console.log(error.message)
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(result instanceof Parse.User ? true : false);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// userWishList - return user wish list
// - items are sorted in order of adding
// - list are limited by 1000 items
//Input:
//	include			: Array			- list of classes to dereference
//Output:
//	Product[]
//Exceptions:
Parse.Cloud.define('userWishList', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.success([]);
	
	Parse.Promise.as().then(
		
		function () {
			
			var products = _.map(request.user.get('productWishList') || [], function (product) {return product.id;});
			
			if (_.isEmpty(products))
				return Parse.Promise.as([]);
				
			var query = new Parse.Query('Product');
			
			query.include(_.parseQueryInclude(request.params.include, ['preview', 'sizes']));
			query.containedIn('objectId', products)
			query.equalTo('published', true);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				function (result) {
					
					return Parse.Promise.as(_.sortBy(result, function(product) {return _.indexOf(products, product.id);}));
					
				}
				
			);
			
		}
		
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// userWishListPut - put product to user wish list
// - product should be published
//Input:
//	product	: Id (required)	- Product Id
//Output:
//	Boolean
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PRODUCT_IS_NOT_AVAILABLE
//	USER_UPDATE_FAILED
Parse.Cloud.define('userWishListPut', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'product') && _.isParseId(request.params.product)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'product'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('Product');
			query.equalTo('published', true);
			return query.get(request.params.product, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_IS_NOT_AVAILABLE));
				}
			);
			
		}
	
	).then(
		
		function (product) {
			
			var relation = request.user.relation('wishList');
			
			relation.add(product);
			
			request.user.addUnique('productWishList', product);
			
			return request.user.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function () {
			response.success(true);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// userWishListDelete - delete product from user wish list
//Input:
//	product	: Id (required)	- Product Id
//Output:
//	Boolean
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PRODUCT_IS_NOT_AVAILABLE
//	USER_UPDATE_FAILED
Parse.Cloud.define('userWishListDelete', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'product') && _.isParseId(request.params.product)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'product'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('Product');
			return query.get(request.params.product, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_IS_NOT_AVAILABLE));
				}
			);
			
		}
	
	).then(
		
		function (product) {
			
			var relation = request.user.relation('wishList');
			
			relation.remove(product);
			
			request.user.remove('productWishList', product);
			
			return request.user.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function () {
			response.success(true);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// shippingAddressList - return shipping address list
// - items sorted by createdAt attribute and have descending order
// - list are limited by 1000 items
//Input:
//Output:
//	ShippingAddress[]
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
Parse.Cloud.define('shippingAddressList', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('ShippingAddress');
			
			query.equalTo('user', request.user);
			query.notEqualTo('removed', true);
			query.descending('createdAt');
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// shippingAddressAdd - validate and add shipping address
//Input:
//	fullName			: String (required)
//	streetLines			: Array/String (required)
//	city				: String (required)
//	stateOrProvinceCode : String (required)
//	postalCode			: String (required)
//	countryCode			: String (required)
//Output:
//	valid				: Boolean - validation result
//	value				: Object - if the validation was successful
//	- streetLines			: Array
//	- city					: String
//	- stateOrProvinceCode	: String
//	- postalCode			: String
//	- countryCode			: String
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
Parse.Cloud.define('shippingAddressAdd', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	var errors = _
		.chain(['fullName', 'streetLines', 'city', 'stateOrProvinceCode', 'postalCode', 'countryCode'])
		.map(
			function (name) {
				return !(_.requestParamExists(request, name) && !_.isEmpty(request.params[name])) ? name : null;
			}
		)
		.compact()
		.value();
	
	if (!_.isEmpty(errors))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: _.first(errors)}).toString());
	
	var shippingAddress, verifyAddressService, verifyAddressResponse;
	
	Parse.Promise.as().then(
		
		function () {
			
			var item = new Parse.Object('ShippingAddress');
			
			item.set('user', request.user);
			
			item.set('fullName', request.params.fullName);
			item.set('streetLines', _.isArray(request.params.streetLines) ? request.params.streetLines : [request.params.streetLines]);
			item.set('city', request.params.city);
			item.set('stateOrProvinceCode', request.params.stateOrProvinceCode);
			item.set('postalCode', request.params.postalCode);
			item.set('countryCode', request.params.countryCode);
			
			return item.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
	
	/*).then(
	
	    function (shippingAddress) {
	
			var value = {
				streetLines                     : shippingAddress.get('streetLines'),
				city                            : shippingAddress.get('city'),
				stateOrProvinceCode  		   : shippingAddress.get('stateOrProvinceCode'),
				postalCode                      : shippingAddress.get('postalCode'),
				countryCode                     : shippingAddress.get('countryCode')
			}
			
			shippingAddress.set('value', value);
	
            return shippingAddress.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
	
        }
	
	/*).then(
	
		function (shippingAddress) {
			response.success({valid: true, value: shippingAddress.get('value')});
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
	
	);*/
	
	).then(
		
		function (result) {
			
			shippingAddress = result;
			
			var addressEntity = new AddressEntity();
			
			addressEntity
				.set('streetLines', shippingAddress.get('streetLines'))
				.set('city', shippingAddress.get('city'))
				.set('stateOrProvinceCode', shippingAddress.get('stateOrProvinceCode'))
				.set('postalCode', shippingAddress.get('postalCode'))
				.set('countryCode', shippingAddress.get('countryCode'));
			
			verifyAddressService = TaxCloud.verifyAddressRequest();
			
			verifyAddressService
				.setAddress(addressEntity);
				
			return verifyAddressService.query().then(
				
				null,
				function (error) {
					return Parse.Promise.as(error)
				}
				
			);
			
		}
		
	).then(
		
		function (result) {
			
			verifyAddressResponse = result;
			
			if (verifyAddressService._request)
				shippingAddress.set('validationRequest', JSON.stringify(verifyAddressService._request));
			
			if (verifyAddressService._response)
				shippingAddress.set('validationResponse', JSON.stringify(verifyAddressService._response));
			
			if (!(verifyAddressResponse instanceof ArmariumError))
				shippingAddress.set('value', verifyAddressResponse.encode());
			else
				shippingAddress.set('removed', true);
			
			return shippingAddress.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
		
	).then(
		
		function (shippingAddress) {
			
			if (verifyAddressResponse instanceof ArmariumError)
				response.success({valid: false, message: verifyAddressResponse.toString(true)});
			else
				response.success({valid: true, value: _.extend({}, {id: shippingAddress.id}, shippingAddress.get('value'))});
				
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// shippingAddressConvert - validate and add shipping address
//Input:
//	shippingAddress			: Id (required)
//Output:
//	valid				: Boolean - validation result
//	value				: Object - if the validation was successful
//	- streetLines			: Array
//	- city					: String
//	- stateOrProvinceCode	: String
//	- postalCode			: String
//	- countryCode			: String
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
Parse.Cloud.define('shippingAddressConvert', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'shippingAddress'}).toString());
	
	var shippingAddress, verifyAddressService, verifyAddressResponse;
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('ShippingAddress');
			query.equalTo('user', request.user);
			return query.get(request.params.shippingAddress, {useMasterKey: true}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			
			shippingAddress = result;
			
			var addressEntity = new AddressEntity();
			
			addressEntity
				.set('streetLines', shippingAddress.get('streetLines'))
				.set('city', shippingAddress.get('city'))
				.set('stateOrProvinceCode', shippingAddress.get('stateOrProvinceCode'))
				.set('postalCode', shippingAddress.get('postalCode'))
				.set('countryCode', shippingAddress.get('countryCode'));
			
			verifyAddressService = TaxCloud.verifyAddressRequest();
			
			verifyAddressService
				.setAddress(addressEntity);
				
			return verifyAddressService.query().then(
				
				null,
				function (error) {
					return Parse.Promise.as(error)
				}
				
			);
			
		}
		
	).then(
		
		function (result) {
			
			verifyAddressResponse = result;
			
			if (verifyAddressService._request)
				shippingAddress.set('validationRequest', JSON.stringify(verifyAddressService._request));
			
			if (verifyAddressService._response)
				shippingAddress.set('validationResponse', JSON.stringify(verifyAddressService._response));
			
			if (!(verifyAddressResponse instanceof ArmariumError))
				shippingAddress.set('value', verifyAddressResponse.encode());
			else
				shippingAddress.set('removed', true);
			
			shippingAddress.set('converted', true);
			
			return shippingAddress.save(null, {useMasterKey: true});
			
		}
		
	).then(
		
		function (shippingAddress) {
			
			if (verifyAddressResponse instanceof ArmariumError)
				response.success({valid: false, message: verifyAddressResponse.toString(true)});
			else
				response.success({valid: true, value: shippingAddress.get('value')});
				
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// shippingAddressRemove - remove shipping address and unset user default shipping address if it equal to removed shipping address
//Input:
//	shippingAddress		: Id (required)		- ShippingAddress Id
//Output:
//						: Boolean			- True if success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
//	USER_UPDATE_FAILED
//	SHIPPING_ADDRESS_REMOVE_FAILED
Parse.Cloud.define('shippingAddressRemove', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'shippingAddress'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('ShippingAddress');
			query.equalTo('user', request.user);
			return query.get(request.params.shippingAddress, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function (shippingAddress) {
			
			shippingAddress.set('removed', true);
			return shippingAddress.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				function (shippingAddress) {
					
					if (request.user.has('defaultShippingAddress') && request.user.get('defaultShippingAddress').id === shippingAddress.id) {
						
						request.user.unset('defaultShippingAddress');
						return request.user.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
							
							null,
							function (error) {
								return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
							}
							
						);
						
					} else
						return Parse.Promise.as();
					
				}
				
			).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_REMOVE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function () {
			response.success(true);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// shippingAddressSetDefault - Set default shipping address to user
//Input:
//	shippingAddress		: Id (required)		- ShippingAddress Id
//Output:
//						: Boolean			- True if success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
//	USER_UPDATE_FAILED
Parse.Cloud.define('shippingAddressSetDefault', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'shippingAddress'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('ShippingAddress');
			query.equalTo('user', request.user);
			query.notEqualTo('removed', true);
			return query.get(request.params.shippingAddress, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function (shippingAddress) {
			
			request.user.set('defaultShippingAddress', shippingAddress);
			return request.user.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function () {
			response.success(true);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// paymentCardList - return shipping address list
// - items sorted by createdAt attribute and have descending order
// - list are limited by 1000 items
//Input:
//Output:
//	PaymentCard[]
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
Parse.Cloud.define('paymentCardList', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('PaymentCard');
			
			query.equalTo('user', request.user);
			query.notEqualTo('removed', true);
			query.descending('createdAt');
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// paymentCardAdd - validate and add payment card
//Input:
//	token		: String (required) - Card token
//	(or)
//	exp_month	: String (required)	- Two digit number representing the card's expiration month.
//	exp_year	: String (required)	- Two or four digit number representing the card's expiration year.
//	number		: String (required)	- The card number, as a string without any separators.
//	cvc			: String			- Card security code.
//Output:
//	PaymentCard[]
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	STRIPE_FAILED
//	USER_UPDATE_FAILED
//	STRIPE_CARD_ADD_FAILED
//	STRIPE_*
Parse.Cloud.define('paymentCardAdd', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			if (request.user.has('stripeCustomerId') && (stripeCustomerId = request.user.get('stripeCustomerId')))
				return Parse.Promise.as(stripeCustomerId);
			
			var customerData = {
				account_balance	: 0,
				email			: request.user.get('username'),
				description		: request.user.get('username') + (request.user.has('fullName') ? ' (' + request.user.get('fullName') + ')' : ''),
				metadata		: {
					fullName		: request.user.get('fullName') || '',
					userId			: request.user.id
				}
			};
			
			return Stripe.Customers.create(customerData).then(
				
				function (stripeCustomer) {
					
					console.log(stripeCustomer)
					
					if (!(stripeCustomer && stripeCustomer.id))
						return Parse.Promise.error(new ArmariumError(ArmariumError.STRIPE_FAILED, 'Failed to create Stripe Customer'));
					
					request.user.set('stripeCustomerId', stripeCustomer.id);
					
					return request.user.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
						
						null,
						function (error) {
							console.log(error);
							return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
						}
						
					);
					
				},
				null
				
			).then(
				
				function (user) {
					
					return Parse.Promise.as(user.get('stripeCustomerId'));
					
				}
				
			);
			
		}
		
	).then(
		
		function (stripeCustomerId) {
			
			var params = {};
			
			if (_.requestParamExists(request, 'token'))
				params.source = request.params.token;
			
			else {
				
				params.source = {
					object		: 'card',
					exp_month	: request.params.exp_month || '',
					exp_year	: request.params.exp_year || '',
					number		: request.params.number || ''
				};
				
				if (_.requestParamExists(request, 'cvc'))
					params.source.cvc = request.params.cvc;
				
			}
			
			return Stripe.Customers.createCard(stripeCustomerId, params);
			
		}
		
	).then(
		
		function (stripeCard) {
			
			if (!(stripeCard && stripeCard.id))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STRIPE_CARD_ADD_FAILED));
			
			var item = new Parse.Object('PaymentCard');
			
			item.set('user', request.user);
			
			item.set('stripeCardId', stripeCard.id);
			
			if (_.has(stripeCard, 'brand'))
				item.set('cardType', stripeCard.brand);
			
			if (_.has(stripeCard, 'last4'))
				item.set('trailingDigits', stripeCard.last4);
			
			return item.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// paymentCardRemove - remove payment card and unset user default payment card if it equal to removed payment card
//Input:
//	paymentCard			: Id (required)		- PaymentCard Id
//Output:
//						: Boolean			- True if success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PAYMENT_CARD_IS_NOT_AVAILABLE
//	USER_UPDATE_FAILED
//	PAYMENT_CARD_REMOVE_FAILED
Parse.Cloud.define('paymentCardRemove', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'paymentCard') && _.isParseId(request.params.paymentCard)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'paymentCard'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('PaymentCard');
			query.equalTo('user', request.user);
			return query.get(request.params.paymentCard, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PAYMENT_CARD_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function (paymentCard) {
			
			paymentCard.set('removed', true);
			return paymentCard.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				function (paymentCard) {
					
					if (request.user.has('defaultPaymentCard') && request.user.get('defaultPaymentCard').id === paymentCard.id) {
						
						request.user.unset('defaultPaymentCard');
						return request.user.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
							
							null,
							function (error) {
								return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
							}
							
						);
						
					} else
						return Parse.Promise.as();
					
				}
				
			).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PAYMENT_CARD_REMOVE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function () {
			response.success(true);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// paymentCardSetDefault - Set default payment card to user
//Input:
//	paymentCard			: Id (required)		- PaymentCard Id
//Output:
//						: Boolean			- True if success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PAYMENT_CARD_IS_NOT_AVAILABLE
//	USER_UPDATE_FAILED
Parse.Cloud.define('paymentCardSetDefault', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'paymentCard') && _.isParseId(request.params.paymentCard)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'paymentCard'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('PaymentCard');
			query.equalTo('user', request.user);
			query.notEqualTo('removed', true);
			return query.get(request.params.paymentCard, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PAYMENT_CARD_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function (paymentCard) {
			
			request.user.set('defaultPaymentCard', paymentCard);
			return request.user.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.USER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function () {
			response.success(true);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});



////////////////////////////////////////////////////////////////////////////////
// PRODUCT TODO


// brandList - return sorted published brand list
// - sorting have ascending order
// - items with undefined order has higher priority
// - list are limited by 1000 items
//Input:
//	include			: Array		- list of classes to dereference
//Output:
//	Brand[]
//Exceptions:
Parse.Cloud.define('brandList', function(request, response) {
	
	return Parse.Promise.as().then(
		
		function () {
	
			var query = new Parse.Query('Brand');
			query.include(_.parseQueryInclude(request.params.include, ['image']));
			query.equalTo('published', true);
			query.ascending('sortOrder');
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// collectionList - return sorted published collection list
// - item without images is not showed
// - sorting have ascending order
// - items with undefined order has higher priority
// - list are limited by 1000 items
//Input:
//	include			: Array		- list of classes to dereference
//	includePrivate	: Boolean	- include private collection (default = false)
//Output:
//	Collection[]
//Exceptions:
Parse.Cloud.define('collectionList', function(request, response) {
	
	return Parse.Promise.as().then(
		
		function () {
			
			var query;
			
			if (request.params.includePrivate === true) {
				
				var queryPublished = new Parse.Query('Collection');
				queryPublished.equalTo('published', true);
				
				var queryPrivate = new Parse.Query('Collection');
				queryPrivate.equalTo('private', true);
				
				query = Parse.Query.or(queryPublished, queryPrivate);
				
			} else {
				
				query = new Parse.Query('Collection');
				query.equalTo('published', true);
				
			}
			
			query.include(_.parseQueryInclude(request.params.include, ['preview']));
			query.exists('preview');
			query.ascending('sortOrder');
			query.limit(PAGINATION_LIMIT);
			
			/*var query = new Parse.Query('Collection');
			query.include(_.parseQueryInclude(request.params.include, ['preview']));
			query.exists('preview');
			if (request.params.includePrivate !== true)
				query.notEqualTo('private', true);
			query.equalTo('published', true);
			query.ascending('sortOrder');
			query.limit(PAGINATION_LIMIT);*/
				
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
		}
		
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// productFilterList - return values for product filter
//Input:
//	key				: String (required)			- key name, one of the following - brand, category, size, price
//Output:
//	Object[]
//		value		: *							- filter item value
//		text		: String					- filter item text
//Exceptions:
//	PARAM_IS_NOT_VALID
Parse.Cloud.define('productFilterList', function(request, response) {
	
	if (!(_.requestParamExists(request, 'key') && _.contains(PRODUCT_FILTER, request.params.key)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_VALID, null, {name: 'key'}).toString());
	
	var promise = Parse.Promise.as();
	
	if (request.params.key === PRODUCT_FILTER_BRAND) {
		
		/*promise = promise.then(
			
			function () {
				
				var query = new Parse.Query('Brand');
				query.include('image');
				query.equalTo('published', true);
				query.ascending('sortOrder');
				query.limit(PAGINATION_LIMIT);
				
				return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
				
			}
			
		).then(
			
			function (result) {
				
				var items = _.map(result, function (item) {
					
					return {value: item.id, text: item.get('name') || ''};
					
				});
				
				return Parse.Promise.as(items);
				
			}
			
		);*/
		
		promise = promise.then(
			
			function () {
				
				var query = new Parse.Query('Product');
				query.select('brand');
				query.exists('brand');
				query.greaterThan('quantity', 0);
				query.equalTo('published', true);
				query.limit(PAGINATION_LIMIT);
				
				return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
				
			}
			
		).then(
			
			function (products) {
				
				var brands = [];
				
				_.each(
					products,
					function (product) {
						
						var brandId = product.get('brand').id;
						
						if (!_.contains(brands, brandId))
							brands.push(brandId);
						
					}
				);
				
				var query = new Parse.Query('Brand');
				query.include('image');
				query.containedIn('objectId', brands);
				query.equalTo('published', true);
				query.ascending('sortOrder');
				query.limit(PAGINATION_LIMIT);
				
				return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
			}
		
		).then(
			
			function (brands) {
				
				return Parse.Promise.as(_.map(brands, function (brand) {return {value: brand.id, text: brand.get('name') || ''};}));
				
			}
			
		);
		
	} else if (request.params.key === PRODUCT_FILTER_CATEGORY) {
		
		/*promise = promise.then(
			
			function () {
				
				return Parse.Promise.as(PRODUCT_FILTER_ITEMS_CATEGORY);
				
			}
			
		);*/
		
		promise = promise.then(
			
			function () {
				
				var query = new Parse.Query('Product');
				query.select('categories');
				query.exists('categories');
				query.greaterThan('quantity', 0);
				query.equalTo('published', true);
				query.limit(PAGINATION_LIMIT);
				
				return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
				
			}
			
		).then(
			
			function (products) {
				
				var values = _.reduce(products, function (memo, product) {return _.union(memo, product.get('categories'));}, []);
				
				return Parse.Promise.as(_.filter(PRODUCT_FILTER_ITEMS_CATEGORY, function (value) {return _.contains(this, value.value);}, values));
				
			}
			
		);
		
	} else if (request.params.key === PRODUCT_FILTER_SIZE) {
		
		/*promise = promise.then(
			
			function () {
				
				return Parse.Promise.as(PRODUCT_FILTER_ITEMS_SIZE);
				
			}
			
		);*/
		
		promise = promise.then(
			
			function () {
				
				var query = new Parse.Query('Product');
				query.select('sizeRangeUS');
				query.exists('sizeRangeUS');
				query.greaterThan('quantity', 0);
				query.equalTo('published', true);
				query.limit(PAGINATION_LIMIT);
				
				return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
				
			}
			
		).then(
			
			function (products) {
				
				var values = _.reduce(products, function (memo, product) {return _.union(memo, product.get('sizeRangeUS'));}, []);
				
				return Parse.Promise.as(_.filter(PRODUCT_FILTER_ITEMS_SIZE, function (value) {return _.contains(this, value.value);}, values));
				
				/*var
					values = _.reduce(products, function (memo, product) {return _.union(memo, product.get('sizeRangeUS'));}, []),
					numeralValues = _.filter(values, function (value) {return !_.isNaN(Number(value));}),
					literalValues = _.filter(values, function (value) {return false;}); // TODO This removes all non-numeral sizes, replace to _.isNaN(Number(value)) to allow them  
				
				var allValues = _.union(
					_
					.chain(numeralValues)
					.sortBy(function (value) {return Number(value);})
					.map(function (value) {return {value: value, text: 'US ' + value};})
					.value()
					,
					_
					.chain(literalValues)
					.sortBy(function (value) {return value;})
					.map(function (value) {return {value: value, text: value};})
					.value()
				);
				
				return Parse.Promise.as(allValues);*/
				
			}
			
		);
		
	} else if (request.params.key === PRODUCT_FILTER_PRICE) {
		
		/*promise = promise.then(
			
			function () {
				
				return Parse.Promise.as(PRODUCT_FILTER_ITEMS_PRICE);
				
			}
			
		);*/
		
		promise = promise.then(
			
			function () {
				
				var query = new Parse.Query('Product');
				query.select('priceRange');
				query.exists('priceRange');
				query.greaterThan('quantity', 0);
				query.equalTo('published', true);
				query.limit(PAGINATION_LIMIT);
				
				return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
				
			}
			
		).then(
			
			function (products) {
				
				var values = _.reduce(products, function (memo, product) {return _.union(memo, product.get('priceRange'));}, []);
				
				return Parse.Promise.as(_.filter(PRODUCT_FILTER_ITEMS_PRICE, function (value) {return _.contains(this, value.value);}, values));
				
			}
			
		);
		
	} else if (request.params.key === PRODUCT_FILTER_DATE) {
		
		promise = promise.then(
			
			function () {
				
				return Parse.Promise.as([]);
				
			}
			
		);
		
	}
	
	promise.then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// productList - return sorted available product list optionaly filtered by collection and by date range
// - sorting have ascending order
// - items with undefined order has higher priority
// - collection has higher priority than product
// - list are limited by 1000 items
// - if date range is specified, result will be limited to products which have one or more sizes which available in specified date range for a period greater than or equal to product.delayBefore + PRODUCT_RENT_LENGTH_MIN + product.delayAfter
//Input:
//	collection		: Id			- Collection Id
//	dateFrom		: Date			- start date range
//	dateTill		: Date			- end date range
//	- or -
//	filter			: Object
//	- and -
//	include			: Array			- list of classes to dereference
//	skip			: Number		- Skip records
//	limit			: Number		- Limit result count
//Output:
//	Product[]
//Exceptions:
//	DATE_RANGE_IS_NOT_VALID
//	COLLECTION_IS_NOT_AVAILABLE
Parse.Cloud.define('productList', function(request, response) {
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(PRODUCT_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(PRODUCT_AVAILABILITY_MAX);
	
	var dateRange;
	
	if (_.requestParamExists(request, 'filter') && _.isObject(request.params.filter) && _.has(request.params.filter, PRODUCT_FILTER_DATE) && (value = request.params.filter[PRODUCT_FILTER_DATE]) && _.isArray(value) && _.size(value) === 2)
		dateRange = new DateRange(value[0], value[1]);
		
	else
		dateRange = new DateRange(request.params.dateFrom, request.params.dateTill);
	
	dateRange.limit(dateMin, dateMax, true);
	
	if (!dateRange.valid())
		return response.error(new ArmariumError(ArmariumError.DATE_RANGE_IS_NOT_VALID).toString());
	
	var collection, productSortOrder = [];
	
	console.log(dateRange)
	
	Parse.Promise.as().then(
		
		function () {
			
			if (_.requestParamExists(request, 'collection') && _.isParseId(request.params.collection)) {
			
				var queryPublished = new Parse.Query('Collection');
				queryPublished.equalTo('published', true);
				
				var queryPrivate = new Parse.Query('Collection');
				queryPrivate.equalTo('private', true);
				
				var query = Parse.Query.or(queryPublished, queryPrivate);
			
				/*var query = new Parse.Query('Collection');
				query.equalTo('published', true);*/
				return query.get(request.params.collection, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.COLLECTION_IS_NOT_AVAILABLE));
					}
					
				);
				
			} else {
				
				var queryPublished = new Parse.Query('Collection');
				queryPublished.equalTo('published', true);
				
				var queryPrivate = new Parse.Query('Collection');
				queryPrivate.equalTo('private', true);
				
				var query = Parse.Query.or(queryPublished, queryPrivate);
				
				/*var query = new Parse.Query('Collection');
				query.equalTo('published', true);*/
				query.ascending('sortOrder');
				query.limit(PAGINATION_LIMIT);
				return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
				
			}
			
		}
	
	).then(

		function (result) {
			
			collection = result instanceof Parse.Object ? result : null;
			
			if (collection instanceof Parse.Object)
				
				productSortOrder = _
					.map(
						
						result.get('product'),
						function (value) {
							return value.id;
						}
						
					);
			
			else
				
				productSortOrder = null;
			
			var query = new Parse.Query('Product');
			
			query.include(_.parseQueryInclude(request.params.include, ['preview', 'sizes']));
			if (collection instanceof Parse.Object)
				query.containedIn('objectId', productSortOrder);
			
			// Filter logic
			if (_.requestParamExists(request, 'filter') && _.isObject(request.params.filter)) {
				
				_.each(request.params.filter, function (filterValues, filterKey) {
					
					if (filterKey === PRODUCT_FILTER_BRAND && _.isArray(filterValues)) {
						
						var values = _
							.chain(filterValues)
							.filter(function (value) {
								return _.isParseId(value);
							})
							.map(function (value) {

								var brand = new Parse.Object('Brand');
								brand.id = value;
								
								return brand;
							
							})
							.value();
						
						this.containedIn('brand', values);
						
					} else if (filterKey === PRODUCT_FILTER_CATEGORY && _.isArray(filterValues)) {
						
						var available = _.pluck(PRODUCT_FILTER_ITEMS_CATEGORY, 'value');
						
						var values = _.filter(filterValues, function (value) {
							return _.contains(this, value);
						}, available);
						
						this.containedIn('categories', values);
						
						
					} else if (filterKey === PRODUCT_FILTER_SIZE && _.isArray(filterValues)) {
						
						var available = _.pluck(PRODUCT_FILTER_ITEMS_SIZE, 'value');
						
						var values = _.filter(filterValues, function (value) {
							return _.contains(this, value);
						}, available);
						
						this.containedIn('sizeRangeUS', values);
						
						/*var sizeQuery = new Parse.Query('ProductSize');
						sizeQuery.containedIn('nameUS', values);
						
						this.matchesQuery('sizes', sizeQuery);*/
						
					} else if (filterKey === PRODUCT_FILTER_PRICE && _.isArray(filterValues)) {
						
						var available = _.pluck(PRODUCT_FILTER_ITEMS_PRICE, 'value');
						
						var values = _.filter(filterValues, function (value) {
							return _.contains(this, value);
						}, available);
						
						this.containedIn('priceRange', values);
						
					}
					
				}, query);
				
			}
			
			query.exists('sizes');
			query.greaterThan('quantity', 0);
			query.equalTo('published', true);
			query.ascending('sortOrder');
			query.skip(0);
			query.limit(PAGINATION_LIMIT);
			
			if (!(collection instanceof Parse.Object)) {
				
				if (_.requestParamExists(request, 'skip') && _.isNumber(request.params.skip) && request.params.skip >= 0)
					query.skip(request.params.skip);
					
				if (_.requestParamExists(request, 'limit') && _.isNumber(request.params.limit) && request.params.limit >= 1)
					query.limit(request.params.limit);
				
			}
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
		
		}
	
	).then(
		
		function (products) {
			
			if (_.isEmpty(products))
				return Parse.Promise.as([]);
			
			if (!dateRange.defined())
				return Parse.Promise.as(products);
			
			var
				productDelayBefore = {},
				productDelayAfter = {},
				productLookupRange = {};
				
			_.each(products, function (product) {
				
				var
					productId = product.id,
					delayBefore = product.get('delayBefore') || PRODUCT_DELAY_BEFORE,
					delayAfter = product.get('delayAfter') || PRODUCT_DELAY_AFTER;
				
				productDelayBefore[productId] = delayBefore;
				productDelayAfter[productId] = delayAfter;
				
				productLookupRange[productId] = dateRange.extend(delayBefore, delayAfter, true).limit(dateMin, dateMax).range(true);
				
			});
			
			var lookupRange = dateRange.extend(_.max(productDelayBefore), _.max(productDelayAfter), true);
			
			var query = new Parse.Query('ProductOrder');
				
			query.select(['product', 'productSize', 'dateRange']);
			query.containedIn('product', products);
			query.exists('productSize');
			query.containedIn('dateRange', lookupRange.range());
			query.notContainedIn('state', [PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED]);
			query.limit(PAGINATION_LIMIT);
				
			return query.find({useMasterKey: true}).then(
				
				function (productOrders) {
					
					var availability = {};
					
					//---
					//console.log('Fill product size quantities for all dates in range');
					
					_.each(products, function (product) {
						
						var productId = product.id;
						
						availability[productId] = {};
						
						_.each(product.get('sizes'), function (productSize) {
							
							var productSizeId = productSize.id;
							
							availability[productId][productSizeId] = _.fillWith(productLookupRange[productId], productSize.get('quantity') || 0);
							
						});
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Decrease product size quantities for all dates in orders');
					
					_.each(productOrders, function (productOrder) {
						
						var
							productId = productOrder.get('product').id,
							productSizeId = productOrder.get('productSize').id;
						
						_
						.chain(productOrder.get('dateRange'))
						.invoke('valueOf')
						.intersection(productLookupRange[productId])
						.increment(availability[productId][productSizeId], -1)
						.value();
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Drop unavailable dates');
					
					_.each(availability, function (productSizes, productId) {
						_.each(productSizes, function (productSizeQuantities, productSizeId) {
						
							availability[productId][productSizeId] = _.filterKeys(productSizeQuantities, function (value) {return value > 0;}, function (key) {return Number(key);});
						
						});
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Convert dates to ranges');
					
					_.each(availability, function (productSizes, productId) {
						_.each(productSizes, function (productSizeTimestamps, productSizeId) {
						
							availability[productId][productSizeId] = _.toRange(productSizeTimestamps, function (memo, value) {return value - memo.till === 24 * 60 * 60 * 1000;});
						
						});
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Reduce ranges on the amount of delay');
					
					_.each(availability, function (productSizes, productId) {
						_.each(productSizes, function (productSizeRanges, productSizeId) {
						
							availability[productId][productSizeId] = _.shrinkRange(productSizeRanges, productDelayBefore[productId], productDelayAfter[productId]);
						
						});
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Filter ranges');
					
					_.each(availability, function (productSizes, productId) {
						_.each(productSizes, function (productSizeRanges, productSizeId) {
						
							availability[productId][productSizeId] = _.filter(productSizeRanges, function (productSizeRange) {return productSizeRange.count >= PRODUCT_RENT_LENGTH_MIN});
						
						});
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Filter product sizes');
					
					_.each(availability, function (productSizes, productId) {
						
						availability[productId] = _.filterKeys(productSizes, function (items) {return _.size(items) > 0;});
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Filter products');
					
					var available = _.filterKeys(availability, function (items) {return _.size(items) > 0;});
					
					//console.log(JSON.stringify(available, null, '\t'));
					
					//---
					return Parse.Promise.as(_.filter(products, function (product) {return _.contains(this, product.id);}, available));
					
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(_.isArray(productSortOrder) ? _.sortBy(result, function (product) {return _.indexOf(this, product.id);}, productSortOrder) : result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// productSizeList - return sorted available product size list optionaly filtered by date range
// - product should be published
// - sorting have ascending order
// - items with undefined order has higher priority
// - list are limited by 1000 items
// - if date range is specified, result will be limited to product sizes which available in specified date range for a period greater than or equal to product.delayBefore + PRODUCT_RENT_LENGTH_MIN + product.delayAfter
//Input:
//	product			: Id (required)	- Product Id
//	dateFrom		: Date			- start date range
//	dateTill		: Date			- end date range
//Output:
//	ProductSize[]
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
//	DATE_RANGE_IS_NOT_VALID
//	PRODUCT_IS_NOT_AVAILABLE
Parse.Cloud.define('productSizeList', function(request, response) {
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(PRODUCT_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(PRODUCT_AVAILABILITY_MAX);
	
	if (!(_.requestParamExists(request, 'product') && _.isParseId(request.params.product)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'product'}).toString());
	
	var dateRange = new DateRange(request.params.dateFrom, request.params.dateTill);
	
	dateRange.limit(dateMin, dateMax, true);
	
	if (!dateRange.valid())
		return response.error(new ArmariumError(ArmariumError.DATE_RANGE_IS_NOT_VALID).toString());
	
	var product, productSizeOrder;
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('Product');
			
			query.exists('sizes');
			query.greaterThan('quantity', 0);
			query.equalTo('published', true);
			
			return query.get(request.params.product, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			
			product = result;
			
			productSizeOrder = _.map(product.get('sizes'), function (productSize) {return productSize.id;});
			
			var query = new Parse.Query('ProductSize');
			
			query.equalTo('product', product);
			query.greaterThan('quantity', 0);
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
		
		}
	
	).then(
		
		function (productSizes) {
			
			if (_.isEmpty(productSizes))
				return Parse.Promise.as([]);
				
			if (!dateRange.defined())
				return Parse.Promise.as(productSizes);
			
			var
				productDelayBefore = product.get('delayBefore') || PRODUCT_DELAY_BEFORE,
				productDelayAfter = product.get('delayAfter') || PRODUCT_DELAY_AFTER;
			
			var productLookupRange = dateRange.extend(productDelayBefore, productDelayAfter, true).limit(dateMin, dateMax).range(true);
				
			var lookupRange = dateRange.extend(productDelayBefore, productDelayAfter, true);
				
			var query = new Parse.Query('ProductOrder');
			
			query.select(['product', 'productSize', 'dateRange']);
			query.equalTo('product', product);
			query.containedIn('productSize', productSizes);
			query.containedIn('dateRange', lookupRange.range());
			query.notContainedIn('state', [PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED]);
			query.limit(PAGINATION_LIMIT);
			
			return query.find({useMasterKey: true}).then(
				
				function (productOrders) {
					
					var availability = {};
					
					//---
					//console.log('Fill product size quantities');
					
					_.each(productSizes, function (productSize) {
						
						var productSizeId = productSize.id;
						
						availability[productSizeId] = _.fillWith(productLookupRange, productSize.get('quantity') || 0);
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Decrease product size quantities');
					
					_.each(productOrders, function (productOrder) {
						
						var productSizeId = productOrder.get('productSize').id;
						
						_
						.chain(productOrder.get('dateRange'))
						.invoke('valueOf')
						.intersection(productLookupRange)
						.increment(availability[productSizeId], -1)
						.value();
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Drop unavailable dates');
					
					_.each(availability, function (productSizeQuantities, productSizeId) {
						
						availability[productSizeId] = _.filterKeys(productSizeQuantities, function (value) {return value > 0;}, function (key) {return Number(key);});
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Convert dates to ranges');
					
					_.each(availability, function (productSizeTimestamps, productSizeId) {
					
						availability[productSizeId] = _.toRange(productSizeTimestamps, function (memo, value) {return value - memo.till === 24 * 60 * 60 * 1000;});
					
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Reduce ranges on the amount of delay');
					
					_.each(availability, function (productSizeRanges, productSizeId) {
					
						availability[productSizeId] = _.shrinkRange(productSizeRanges, productDelayBefore, productDelayAfter);
					
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Filter ranges');
					
					_.each(availability, function (productSizeRanges, productSizeId) {
					
						availability[productSizeId] = _.filter(productSizeRanges, function (productSizeRange) {return productSizeRange.count >= PRODUCT_RENT_LENGTH_MIN});
					
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Filter product sizes');
					
					var available = _.filterKeys(availability, function (items) {return _.size(items) > 0;});
					
					//console.log(JSON.stringify(available, null, '\t'));
					
					//---
					return Parse.Promise.as(_.filter(productSizes, function (size) {return _.contains(this, size.id);}, available));
					
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			response.success(_.sortBy(result, function (item) {return _.indexOf(this, item.id);}, productSizeOrder));
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// productSizeUnavailability - return date ranges when this product size is unavailable
// - product should be published
//Input:
//	productSize		: Id (required)		- ProductSize Id
//	dateFrom		: Date (default = now + PRODUCT_AVAILABILITY_MIN)	- start date range
//	dateTill		: Date (default = now + PRODUCT_AVAILABILITY_MAX)	- end date range
//Output:
//	DateRange[]
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
//	DATE_RANGE_IS_NOT_VALID
//	PRODUCT_SIZE_IS_NOT_AVAILABLE
//	PRODUCT_IS_NOT_AVAILABLE
Parse.Cloud.define('productSizeUnavailability', function(request, response) {
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(PRODUCT_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(PRODUCT_AVAILABILITY_MAX);
	
	if (!(_.requestParamExists(request, 'productSize') && _.isParseId(request.params.productSize)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productSize'}).toString());
	
	var dateRange = new DateRange(request.params.dateFrom, request.params.dateTill);
	
	dateRange.default(dateMin, dateMax);
	
	if (!dateRange.defined())
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'dateFrom or dateTill'}).toString());
	
	dateRange.limit(dateMin, dateMax, true);
	
	if (!dateRange.valid())
		return response.error(new ArmariumError(ArmariumError.DATE_RANGE_IS_NOT_VALID).toString());
	
	var product, productSize;
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('ProductSize');
			
			query.include('product');
			query.exists('product');
			query.greaterThan('quantity', 0);
			
			return query.get(request.params.productSize, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_SIZE_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			
			productSize = result;
			product = productSize.get('product');
			
			if (!((product instanceof Parse.Object) && product.get('published') === true && product.get('quantity') > 0))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_IS_NOT_AVAILABLE));
			
			var
				productDelayBefore = product.get('delayBefore') || PRODUCT_DELAY_BEFORE,
				productDelayAfter = product.get('delayAfter') || PRODUCT_DELAY_AFTER;
			
			var productLookupRange = dateRange.extend(productDelayBefore, productDelayAfter, true).limit(dateMin, dateMax).range(true);
			
			//console.log(JSON.stringify(productLookupRange, null, '\t'));
				
			var lookupRange = dateRange.extend(productDelayBefore, productDelayAfter, true);
			
			var query = new Parse.Query('ProductOrder');
			
			query.select(['product', 'productSize', 'dateRange']);
			query.equalTo('product', product);
			query.equalTo('productSize', productSize);
			query.containedIn('dateRange', lookupRange.range());
			query.notContainedIn('state', [PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED]);
			query.limit(PAGINATION_LIMIT);
			
			return query.find({useMasterKey: true}).then(
		
				function (productOrders) {
					
					var availability = {};
					
					//---
					//console.log('Fill product size quantities');
					
					availability = _.fillWith(productLookupRange, productSize.get('quantity') || 0);
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Decrease product size quantities');
					
					_.each(productOrders, function (productOrder) {
						
						_
						.chain(productOrder.get('dateRange'))
						.invoke('valueOf')
						.intersection(productLookupRange)
						.increment(availability, -1)
						.value();
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Drop unavailable dates');
					 
					availability = _.filterKeys(availability, function (value) {return value > 0;}, function (key) {return Number(key);});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Convert dates to ranges');
					
					availability = _.toRange(availability, function (memo, value) {return value - memo.till === 24 * 60 * 60 * 1000;});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Reduce ranges on the amount of delay');
					
					availability = _.shrinkRange(availability, productDelayBefore, productDelayAfter);
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Filter ranges');
					
					availability = _.filter(availability, function (productSizeRange) {return productSizeRange.count >= PRODUCT_RENT_LENGTH_MIN});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Invert ranges');
					
					var availableTimestamp = _
							.chain(availability)
							.map(function (productSizeRange) {return productSizeRange.items;})
							.flatten()
							.uniq()
							.value();
					
					//console.log(JSON.stringify(availableTimestamp, null, '\t'));
					
					var unavailableTimestamp = _.difference(productLookupRange, availableTimestamp);
					
					//console.log(JSON.stringify(unavailableTimestamp, null, '\t'));
				
					availability = _.toRange(unavailableTimestamp, function (memo, value) {return value - memo.till === 24 * 60 * 60 * 1000;});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Convert timestamp to date');
					
					availability = _.map(availability, function (productSizeRange) {
						
						productSizeRange.from = moment.utc(productSizeRange.from).toDate();
						productSizeRange.till = moment.utc(productSizeRange.till).toDate();
						productSizeRange.items = _.map(productSizeRange.items, function (productSizeTimestamp) {return moment.utc(productSizeTimestamp).toDate();});
						return productSizeRange;
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					return Parse.Promise.as(availability);
						 
				}
			);
		
		}
		
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// productSizeLookup - return rent amount for specified product size and date range
// - product should be published
//Input:
//	productSize		: Id (required)		- ProductSize Id
//	dateFrom		: Date (required)	- start date range
//	dateTill		: Date (required)	- end date range
//Output:
//	Number
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
//	DATE_RANGE_IS_NOT_VALID
//	PRODUCT_SIZE_IS_NOT_AVAILABLE
//	PRODUCT_IS_NOT_AVAILABLE
Parse.Cloud.define('productSizeLookup', function(request, response) {
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(PRODUCT_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(PRODUCT_AVAILABILITY_MAX);
	
	if (!(_.requestParamExists(request, 'productSize') && _.isParseId(request.params.productSize)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productSize'}).toString());
	
	var dateRange = new DateRange(request.params.dateFrom, request.params.dateTill);
	
	if (!dateRange.defined())
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'dateFrom or dateTill'}).toString());
	
	dateRange.limit(dateMin, dateMax, true);
	
	if (!dateRange.valid())
		return response.error(new ArmariumError(ArmariumError.DATE_RANGE_IS_NOT_VALID).toString());
	
	var product, productSize;
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('ProductSize');
			
			query.include('product');
			query.exists('product');
			query.greaterThan('quantity', 0);
			
			return query.get(request.params.productSize, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_SIZE_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			
			productSize = result;
			product = productSize.get('product');
			
			if (!((product instanceof Parse.Object) && product.get('published') === true && product.get('quantity') > 0))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_IS_NOT_AVAILABLE));
			
			var
				productDelayBefore = product.get('delayBefore') || PRODUCT_DELAY_BEFORE,
				productDelayAfter = product.get('delayAfter') || PRODUCT_DELAY_AFTER;
			
			var productLookupRange = dateRange.extend(productDelayBefore, productDelayAfter, true).limit(dateMin, dateMax).range(true);
			
			//console.log(JSON.stringify(productLookupRange, null, '\t'));
				
			var lookupRange = dateRange.extend(productDelayBefore, productDelayAfter, true);
			
			var query = new Parse.Query('ProductOrder');
			
			query.select(['product', 'productSize', 'dateRange']);
			query.equalTo('product', product);
			query.equalTo('productSize', productSize);
			query.containedIn('dateRange', lookupRange.range());
			query.notContainedIn('state', [PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED]);
			query.limit(PAGINATION_LIMIT);
			
			return query.find({useMasterKey: true}).then(
		
				function (productOrders) {
			
					var availability = {};
					
					//---
					//console.log('Fill product size quantities');
					
					availability = _.fillWith(productLookupRange, productSize.get('quantity') || 0);
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Decrease product size quantities');
					
					_.each(productOrders, function (productOrder) {
						
						_
						.chain(productOrder.get('dateRange'))
						.invoke('valueOf')
						.intersection(productLookupRange)
						.increment(availability, -1)
						.value();
						
					});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Drop unavailable dates');
					 
					availability = _.filterKeys(availability, function (value) {return value > 0;}, function (key) {return Number(key);});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Convert dates to ranges');
					
					availability = _.toRange(availability, function (memo, value) {return value - memo.till === 24 * 60 * 60 * 1000;});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Reduce ranges on the amount of delay');
					
					availability = _.shrinkRange(availability, productDelayBefore, productDelayAfter);
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					//console.log('Filter ranges');
					
					availability = _.filter(availability, function (productSizeRange) {return productSizeRange.count >= PRODUCT_RENT_LENGTH_MIN});
					
					//console.log(JSON.stringify(availability, null, '\t'));
					
					//---
					if (_.isEmpty(availability))
						return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_SIZE_IS_NOT_AVAILABLE));
					
					return Parse.Promise.as(product.get('price') || 0);
				
				}
				
			);
		
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
		
});


// productOrderCreate - create and return order
//Input:
//	productSize		: Id (required)		- ProductSize Id
//	shippingAddress	: Id				- ShippingAddress Id
//	dateFrom		: Date (required)	- start date range
//	dateTill		: Date (required)	- end date range
//Output:
//	ProductOrder
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	DATE_RANGE_IS_NOT_VALID
//	PRODUCT_SIZE_IS_NOT_AVAILABLE
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
//	PRODUCT_IS_NOT_AVAILABLE
//	PRODUCT_ORDER_CREATE_FAILED
//	PRODUCT_ORDER_IS_NOT_AVAILABLE
Parse.Cloud.define('productOrderCreate', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(PRODUCT_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(PRODUCT_AVAILABILITY_MAX);
	
	var
		node = request.params.node === 2 ? 2 : 1;
	
	if (!(_.requestParamExists(request, 'productSize') && _.isParseId(request.params.productSize)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productSize'}).toString());
	
	// Removing shippingAddress requirements
	/*if (!(_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'shippingAddress'}).toString());*/
	
	var dateRange = new DateRange(request.params.dateFrom, request.params.dateTill);
	
	if (!dateRange.defined())
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'dateFrom or dateTill'}).toString());
	
	dateRange.limit(dateMin, dateMax, true);
	
	if (!dateRange.valid())
		return response.error(new ArmariumError(ArmariumError.DATE_RANGE_IS_NOT_VALID).toString());
	
	/*if (_.size(dateRange.range()) !== PRODUCT_RENT_LENGTH_MIN)
		return response.error(new ArmariumError(ArmariumError.DATE_RANGE_IS_NOT_VALID).toString());*/
	
	var product, productSize, productDiscounts, shippingAddress, previousProductOrders, productOrder, lookupResponse;
	
	Parse.Promise.as().then(
		
		function() {
			
			var promises = [];
			
			var query = new Parse.Query('ProductSize');
			query.include('product');
			query.exists('product');
			query.greaterThan('quantity', 0);
			promises.push(
				query.get(request.params.productSize, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_SIZE_IS_NOT_AVAILABLE));
					}
					
				)
			);
			
			var infiniteDiscountQuery = new Parse.Query('ProductDiscount');
			infiniteDiscountQuery.doesNotExist('expiredAt');
			
			var notExpiredDiscountQuery = new Parse.Query('ProductDiscount');
			notExpiredDiscountQuery.greaterThan('expiredAt', now.toDate());
			
			var query = new Parse.Query.or(infiniteDiscountQuery, notExpiredDiscountQuery);
			query.include('userGroup');
			query.doesNotExist('code');
			query.equalTo('published', true);
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			if (_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)) {
				
				var query = new Parse.Query('ShippingAddress');
				query.exists('value');
				promises.push(query.get(request.params.shippingAddress, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
					}
					
				));
			
			} else
				promises.push(Parse.Promise.as(null));
			
			var query = new Parse.Query('ProductOrder');
			query.equalTo('user', request.user);
			query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED]);
			query.notContainedIn('state', [PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED, PRODUCT_ORDER_STATE_REFUNDED]);
			query.descending('createdAt');
			query.limit(100);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);

		}
		
	).then(
		
		function(result) {
		
			productSize = result[0];
			product = productSize.get('product');
			
			if (!((product instanceof Parse.Object) && product.get('published') === true && product.get('quantity') > 0))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_IS_NOT_AVAILABLE));
			
			productDiscounts = result[1];
			shippingAddress = result[2];
			previousProductOrders = result[3];
			
			var
				productDelayBefore = product.get('delayBefore') || PRODUCT_DELAY_BEFORE,
				productDelayAfter = product.get('delayAfter') || PRODUCT_DELAY_AFTER;
			
			var productLookupRange = dateRange.extend(productDelayBefore, productDelayAfter, true).limit(dateMin, dateMax).range(true);
			
			//console.log(JSON.stringify(productLookupRange, null, '\t'));
				
			var lookupRange = dateRange.extend(productDelayBefore, productDelayAfter, true);
				
			lookupRange.limit(dateMin, dateMax, true);
			
			if (!lookupRange.valid())
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_SIZE_IS_NOT_AVAILABLE));
			
			productOrder = new Parse.Object('ProductOrder');
			
			productOrder.set('orderNumber', productOrderNumberGenerate(now));
			productOrder.set('user', request.user);
			productOrder.set('product', product);
			productOrder.set('productSize', productSize);
			
			if (shippingAddress instanceof Parse.Object)
				productOrder.set('shippingAddress', shippingAddress);
				
			productOrder.set('dateFrom', dateRange.from());
			productOrder.set('dateTill', dateRange.till());
			productOrder.set('dateRange', lookupRange.range());
			
			productOrder.set('node', node);
			
			productOrder.set('searchable', [productOrder.get('orderNumber')]);
			productOrder.set('indexedAt', moment.utc().toDate());
			
			return productOrder.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				function (result) {
					
					productOrder = result;
					
					var query = new Parse.Query('ProductOrder');
					
					query.select(['product', 'productSize', 'dateRange']);
					query.equalTo('product', product);
					query.equalTo('productSize', productSize);
					query.containedIn('dateRange', lookupRange.range());
					query.notContainedIn('state', [PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED]);
					query.limit(PAGINATION_LIMIT);
					
					return query.find({useMasterKey: true}).then(
				
						function (productOrders) {
							
							var availability = {};
					
							//---
							//console.log('Fill product size quantities');
							
							availability = _.fillWith(productLookupRange, productSize.get('quantity') || 0);
							
							//console.log(JSON.stringify(availability, null, '\t'));
							
							//---
							//console.log('Decrease product size quantities');
							
							_.each(productOrders, function (item) {
								
								_
								.chain(item.get('dateRange'))
								.invoke('valueOf')
								.intersection(productLookupRange)
								.increment(availability, -1)
								.value();
								
							});
							
							//console.log(JSON.stringify(availability, null, '\t'));
							
							//---
							//console.log('Drop unavailable dates');
							 
							availability = _.filterKeys(availability, function (value) {return value >= 0;}, function (key) {return Number(key);});
							
							//console.log(JSON.stringify(availability, null, '\t'));
							
							//---
							if (_.isEqual(productLookupRange, availability))
								return Parse.Promise.as();
							
							return productOrder.destroy({useMasterKey: true}).then(
								
								function () {
									return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_SIZE_IS_NOT_AVAILABLE));
								},
								function(error) {
									return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_SIZE_IS_NOT_AVAILABLE));
								}
								
							);
							
						}
					
					);
					
				},
				function(error) {
					console.log(error)
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CREATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function () {
			
			return calculateProductOrderDiscounts(productOrder, request.user, product, productDiscounts, previousProductOrders);
		
		}
	
	).then(
		
		function (productOrder) {
			
			return calculateProductOrderTax(productOrder, request.user, shippingAddress);
			
		}
	
	).then(
		
		function (result) {
			
			productOrder = result.order;
			lookupResponse = result.response;
			
			return calculateProductOrderTotal(productOrder, request.user);
			
		}
	
	).then(
		
		function (productOrder) {
			
			return productOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function(error) {
					console.log(error)
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CREATE_FAILED));
				}
				
			);
			
		}
	
	
	
	).then(
		
		function (productOrder) {
			
			if (lookupResponse instanceof ArmariumError)
				return Parse.Promise.error(lookupResponse);
			
			var query = new Parse.Query('ProductOrder');
			
			query.include(['productDiscounts', 'product', 'product.brand', 'productSize']);
			
			return query.get(productOrder.id, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function(result) {
			response.success(result);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// productOrderRelease - release order
//
//Input:
//	productOrder	: Id (required) - ProductOrder Id
//Output:
//	Boolean
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PRODUCT_ORDER_IS_NOT_AVAILABLE
//	PRODUCT_ORDER_REMOVE_FAILED
Parse.Cloud.define('productOrderRelease', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'productOrder') && _.isParseId(request.params.productOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productOrder'}).toString());

	Parse.Promise.as().then(
		
		function () {
	
			var query = new Parse.Query('ProductOrder');
			return query.get(request.params.productOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
	
		function (productOrder) {
			
			if (_.contains(productOrder.get('state') || [], PRODUCT_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_REMOVE_FAILED));
			
			return productOrder.destroy({useMasterKey: true}).then(
				
				function () {
					return Parse.Promise.as(true);
				},
				function () {
					return Parse.Promise.as(false);
				}
				
			);
			
		}
		
	).then(
		
		function (result) {
			response.success(result);
  		},
  		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// productOrderSetDiscount - update product discount for order
//
//Input:
//	productOrder			: Id (required) - ProductOrder Id
//	productDiscountCode		: String		- product discount code
//Output:
//					: ProductOrder	- If success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PRODUCT_ORDER_IS_NOT_AVAILABLE
//	PRODUCT_DISCOUNT_IS_NOT_AVAILABLE
//	PRODUCT_ORDER_UPDATE_FAILED
Parse.Cloud.define('productOrderSetDiscount', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
		
	var
		now = moment.utc().startOf('day');
	
	if (!(_.requestParamExists(request, 'productOrder') && _.isParseId(request.params.productOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productOrder'}).toString());
	
	if (!(_.requestParamExists(request, 'productDiscountCode') && _.isString(request.params.productDiscountCode)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productDiscountCode'}).toString());
	
	var product, shippingAddress, productOrder, lookupResponse;

	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
	
			var query = new Parse.Query('ProductOrder');
			query.include(['product', 'shippingAddress']);
			query.exists('product');
			query.equalTo('user', request.user);
			promises.push(query.get(request.params.productOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			));
			
			var infiniteDiscountQuery = new Parse.Query('ProductDiscount');
			infiniteDiscountQuery.doesNotExist('expiredAt');
			
			var notExpiredDiscountQuery = new Parse.Query('ProductDiscount');
			notExpiredDiscountQuery.greaterThan('expiredAt', now.toDate());
			
			var query = new Parse.Query.or(infiniteDiscountQuery, notExpiredDiscountQuery);
			query.include('userGroup');
			query.equalTo('published', true);
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			var query = new Parse.Query('ProductOrder');
			query.equalTo('user', request.user);
			query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED]);
			query.notContainedIn('state', [PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED, PRODUCT_ORDER_STATE_REFUNDED]);
			query.descending('createdAt');
			query.limit(100);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
	
		function (result) {
			
			productOrder = result[0];
			productDiscounts = result[1];
			previousProductOrders = result[2];
			
			if (_.contains(productOrder.get('state') || [], PRODUCT_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
			
			product = productOrder.get('product');
			shippingAddress = productOrder.get('shippingAddress');
			productOrder.set('discountCode', request.params.productDiscountCode);
			
			return calculateProductOrderDiscounts(productOrder, request.user, product, productDiscounts, previousProductOrders)
		
		}
	
	).then(
		
		function (productOrder) {
			
			return calculateProductOrderTax(productOrder, request.user, shippingAddress);
			
		}
	
	).then(
		
		function (result) {
			
			productOrder = result.order;
			lookupResponse = result.response;
			
			return calculateProductOrderTotal(productOrder, request.user);
			
		}
	
	).then(
		
		function (productOrder) {
			
			return productOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function(error) {
					console.log(error)
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (productOrder) {
			
			if (lookupResponse instanceof ArmariumError)
				return Parse.Promise.error(lookupResponse);
			
			var query = new Parse.Query('ProductOrder');
			
			query.include(['productDiscounts', 'product', 'product.brand', 'productSize']);
			
			return query.get(productOrder.id, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
		
	).then(
		
		function(productOrder) {
			response.success(productOrder);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// productOrderSetShippingAddress - update shipping address for order
//
//Input:
//	productOrder	: Id (required) - ProductOrder Id
//	shippingAddress	: Id (required)	- ShippingAddress Id
//Output:
//					: ProductOrder	- If success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PRODUCT_ORDER_IS_NOT_AVAILABLE
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
//	PRODUCT_ORDER_UPDATE_FAILED
Parse.Cloud.define('productOrderSetShippingAddress', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	var
		now = moment.utc().startOf('day');
	
	if (!(_.requestParamExists(request, 'productOrder') && _.isParseId(request.params.productOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productOrder'}).toString());
	
	if (!(_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'shippingAddress'}).toString());
		
	var shippingAddress, lookupResponse;

	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
	
			var query = new Parse.Query('ProductOrder');
			query.include(['product']);
			query.exists('product');
			query.equalTo('user', request.user);
			promises.push(query.get(request.params.productOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			));
			
			var query = new Parse.Query('ShippingAddress');
			promises.push(query.get(request.params.shippingAddress, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
				}
				
			));
			
			var infiniteDiscountQuery = new Parse.Query('ProductDiscount');
			infiniteDiscountQuery.doesNotExist('expiredAt');
			
			var notExpiredDiscountQuery = new Parse.Query('ProductDiscount');
			notExpiredDiscountQuery.greaterThan('expiredAt', now.toDate());
			
			var query = new Parse.Query.or(infiniteDiscountQuery, notExpiredDiscountQuery);
			query.include('userGroup');
			query.equalTo('published', true);
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			var query = new Parse.Query('ProductOrder');
			query.equalTo('user', request.user);
			query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED]);
			query.notContainedIn('state', [PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED, PRODUCT_ORDER_STATE_REFUNDED]);
			query.descending('createdAt');
			query.limit(100);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
	
		function (result) {
			
			productOrder = result[0];
			productDiscounts = result[2];
			previousProductOrders = result[3]
			
			if (_.contains(productOrder.get('state') || [], PRODUCT_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
			
			product = productOrder.get('product');
			shippingAddress = result[1];
			
			productOrder.set('shippingAddress', shippingAddress);
			
			return calculateProductOrderDiscounts(productOrder, request.user, product, productDiscounts, previousProductOrders);
		
		}
	
	).then(
		
		function (productOrder) {
			
			return calculateProductOrderTax(productOrder, request.user, shippingAddress);
			
		}
	
	).then(
		
		function (result) {
			
			productOrder = result.order;
			lookupResponse = result.response;
			
			return calculateProductOrderTotal(productOrder, request.user);
			
		}
	
	).then(
		
		function (productOrder) {
			
			return productOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function(error) {
					console.log(error)
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
				}
				
			);
			
		}
	
		
	).then(
		
		function (productOrder) {
			
			if (lookupResponse instanceof ArmariumError)
				return Parse.Promise.error(lookupResponse);
			
			var query = new Parse.Query('ProductOrder');
			
			query.include(['productDiscounts', 'product', 'product.brand', 'productSize']);
			
			return query.get(productOrder.id, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
		
	).then(
		
		function(productOrder) {
			response.success(productOrder);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// productOrderSetPaymentCard - update payment card for order
//
//Input:
//	productOrder	: Id (required) - ProductOrder Id
//	paymentCard		: Id (required)	- PaymentCard Id
//Output:
//					: ProductOrder	- If success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PRODUCT_ORDER_IS_NOT_AVAILABLE
//	PAYMENT_CARD_IS_NOT_AVAILABLE
//	PRODUCT_ORDER_UPDATE_FAILED
Parse.Cloud.define('productOrderSetPaymentCard', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'productOrder') && _.isParseId(request.params.productOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productOrder'}).toString());
	
	if (!(_.requestParamExists(request, 'paymentCard') && _.isParseId(request.params.paymentCard)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'paymentCard'}).toString());

	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
	
			var query = new Parse.Query('ProductOrder');
			query.equalTo('user', request.user);
			promises.push(query.get(request.params.productOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			));
			
			var query = new Parse.Query('PaymentCard');
			promises.push(query.get(request.params.paymentCard, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PAYMENT_CARD_IS_NOT_AVAILABLE));
				}
				
			));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
	
		function (result) {
			
			productOrder = result[0];
			paymentCard = result[1];
			
			if (_.contains(productOrder.get('state') || [], PRODUCT_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
			
			productOrder.set('paymentCard', paymentCard);
			
			return productOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
				}
				
			);
			
		}
		
	).then(
		
		function(productOrder) {
			response.success(productOrder);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// productOrderConfirm - confirm order and make payment
//
//Input:
//	productOrder	: Id (required) - ProductOrder Id
//	paymentCard		: Id (required)	- PaymentCard Id
//Output:
//					: ProductOrder	- If success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	PRODUCT_ORDER_IS_NOT_AVAILABLE
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
//	PAYMENT_CARD_IS_NOT_AVAILABLE
//	PRODUCT_ORDER_IS_ALREADY_CHARGED
//	PRODUCT_ORDER_CONFIRM_FAILED
//	PRODUCT_ORDER_UPDATE_FAILED
//	STRIPE_*
Parse.Cloud.define('productOrderConfirm', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'productOrder') && _.isParseId(request.params.productOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productOrder'}).toString());
	
	/*if (!(_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'shippingAddress'}).toString());*/
	
	if (!(_.requestParamExists(request, 'paymentCard') && _.isParseId(request.params.paymentCard)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'paymentCard'}).toString());
		
	var productOrder, paymentResponse, balanceResponse, completeService, completeResponse;
	
	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
			
			var query = new Parse.Query('ProductOrder');
			query.include(['user', 'paymentCard', 'product', 'productSize']);
			query.equalTo('user', request.user);
			promises.push(query.get(request.params.productOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			));
			
			/*var query = new Parse.Query('ShippingAddress');
			promises.push(query.get(request.params.shippingAddress, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
				}
				
			));*/
			
			var query = new Parse.Query('PaymentCard');
			promises.push(query.get(request.params.paymentCard, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PAYMENT_CARD_IS_NOT_AVAILABLE));
				}
				
			));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
		
		}
	
	).then(
		
		function (result) {
			
			productOrder = result[0];
			paymentCard = result[1];
			
			/*if (!_.contains(productOrder.get('state') || [], PRODUCT_ORDER_STATE_TAXCLOUD_LOOKUPED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CONFIRM_FAILED, 'Order has no calculated tax'));*/
			
			if (_.contains(productOrder.get('state') || [], PRODUCT_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_ALREADY_CHARGED));
			
			if (!(productOrder.has('user') && (user = productOrder.get('user')) && user.has('stripeCustomerId')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CONFIRM_FAILED, 'Order has no specified payment card'));
			
			//productOrder.set('shippingAddress', shippingAddress);
			
			if (!productOrder.has('shippingAddress'))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CONFIRM_FAILED, 'Order has no specified shipping address'));
			
			productOrder.set('paymentCard', paymentCard);
			
			if (!paymentCard.has('stripeCardId'))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CONFIRM_FAILED, 'Order has no specified payment card'));
			
			if (!productOrder.has('product'))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CONFIRM_FAILED, 'Order has no specified product'));
			
			product = productOrder.get('product');
			
			if (!productOrder.has('productSize'))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CONFIRM_FAILED, 'Order has no specified product size'));
			
			if (!(productOrder.has('dateFrom') && productOrder.has('dateTill')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CONFIRM_FAILED, 'Order has no specified date range'));
			
			var
				user				= productOrder.get('user'),
				stripeCustomerId	= user.get('stripeCustomerId'),
				stripeCardId		= paymentCard.get('stripeCardId'),
				dateFrom			= moment.utc(productOrder.get('dateFrom')).format('MM/DD/YYYY'),
				dateTill			= moment.utc(productOrder.get('dateTill')).format('MM/DD/YYYY'),
				totalPrice			= productOrder.get('totalPrice');
			
			// Skip Stripe charging for orders with zero totalPrice
			if (totalPrice > 0) {
				
				var paymentRequest = {
					amount		: Math.round(totalPrice * 100),
					currency	: ARMARIUM_DEFAULT_CURRENCY,
					customer	: stripeCustomerId,
					source		: stripeCardId,
					description	: 'Payment for product "' + (product.get('name') || '') + '" from ' + dateFrom + ' till ' + dateTill,
					metadata	: {
						userId			: user.id,
						productOrderId	: productOrder.id,
						dateFrom		: dateFrom,
						dateTill		: dateTill
					}
				};
				
				console.log(paymentRequest);
				
				productOrder.set('paymentRequest', JSON.stringify(paymentRequest));
				
				return Stripe.Charges.create(paymentRequest).then(
					
					function (result) {
						
						if (_.isObject(result) && result.id && result.object === 'charge' && result.status === 'succeeded')
							return Parse.Promise.as(result);
						
						else
							return Parse.Promise.as(new ArmariumError(ArmariumError.STRIPE_FAILED, null, result));
						
					},
					function (error) {
						return Parse.Promise.as(error)
					}
					
				);
			
			} else
				return Parse.Promise.as(null);
			
		}
		
	).then(
		
		function (result) {
			
			paymentResponse = result;
			
			if (paymentResponse instanceof ArmariumError)
				return Parse.Promise.as(null);
			
			var
				totalBalance		= productOrder.get('totalBalance');
			
			// Process charging for orders from account balance
			if (totalBalance > 0) {
				
				var transaction = new Parse.Object('Transaction');
				
				transaction.set('user', request.user);
				transaction.set('type', TRANSACTION_TYPE_BALANCE_USED);
				transaction.set('value', -totalBalance);
				
				return transaction.save(null, {useMasterKey: true}).then(
					
					null,
					function (error) {
						console.log(error);
						return Parse.Promise.as(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED, 'Failed to change account balance'))
					}
					
				);
				
			} else
				return Parse.Promise.as(null);
		
		}
	
	).then(
		
		function (result) {
			
			balanceResponse = result;
			
			if (paymentResponse instanceof ArmariumError)
				productOrder.set('paymentResponse', JSON.stringify(paymentResponse.data || {}));
			
			else
				productOrder.set('paymentResponse', JSON.stringify(paymentResponse));
			
			var charged = !(paymentResponse instanceof ArmariumError) && !(balanceResponse instanceof ArmariumError);
			
			if (charged === true)
				productOrder.addUnique('state', PRODUCT_ORDER_STATE_CHARGED);
			
			productOrder.addUnique('state', PRODUCT_ORDER_STATE_CONFIRMED);
			
			return productOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
				}
				
			);
				
		}
	
	).then(
		
		function (result) {
			
			productOrder = result;
			
			if (paymentResponse instanceof ArmariumError)
				return Parse.Promise.error(paymentResponse);
			
			if (balanceResponse instanceof ArmariumError)
				return Parse.Promise.error(balanceResponse);
			
			return processSystemEvent(SYSTEM_EVENT_TYPE_PRODUCT_ORDER_CHARGED, request.user).then(
				
				null,
				function (error) {
					console.log(error);
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_CONFIRM_FAILED));
				}
				
			);
		
		}
	
	).then(
		
		function (result) {
			
			completeService = TaxCloud.completeRequest();
			
			completeService
				.setCustomerId(request.user.id)
				.setCartId(productOrder.id)
				.setOrderId(productOrder.id);
				
			return completeService.query().then(
				
				null,
				function (error) {
					return Parse.Promise.as(error)
				}
				
			);

			
		}
	
	).then(
		
		function (result) {
			
			completeResponse = result;
			
			if (completeService._request)
				productOrder.set('taxcloudCompleteRequest', JSON.stringify(completeService._request));
			
			if (completeService._response)
				productOrder.set('taxcloudCompleteResponse', JSON.stringify(completeService._response));
			
			if (!(completeResponse instanceof ArmariumError))
				productOrder.addUnique('state', PRODUCT_ORDER_STATE_TAXCLOUD_CAPTURED);
			
			return productOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function(error) {
					console.log(error)
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function (productOrder) {
			
			// TODO when tax workflow will be applied
			if (paymentResponse instanceof ArmariumError)
				return Parse.Promise.error(paymentResponse);
			
			var query = new Parse.Query('ProductOrder');
			query.include(['user', 'shippingAddress', 'paymentCard', 'productDiscounts', 'product', 'product.brand', 'productSize']);
			return query.get(productOrder.id, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function(productOrder) {
			
			//response.success(productOrder);
			
			var params = {
				Data				: serializer.serialize(productOrder, 'ProductOrder', true),
				AddRecipientsToList	: false
			};
			
			var recipients = [];
			
			if (request.user.has('email'))
				recipients.push(request.user.get('email'));
				
			if (!_.isEmpty(CM_PRODUCT_ORDER_BCC))
				recipients.push(CM_PRODUCT_ORDER_BCC);
			
			recipients = _.object(_.first(['To', 'BCC'], _.size(recipients)), recipients);
			
			if (_.isEmpty(recipients))
				return response.success(productOrder);
				
			params = _.defaults(params, recipients);
			
			return CampaignMonitor.Transactional.smartEmailSend(
				
				CM_NOTIFICATION_TYPE_PRODUCT_ORDER_CONFIRMED,
				params
				
			).then(
				
				function () {
					response.success(productOrder);
				},
				function (error) {
					console.log(error);
					response.success(productOrder);
				}
				
			);
			
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// productOrderList - return product order list
// - items sorted by dateFrom
// - sorting have ascending order for upcoming items and descending order for past items
// - list are limited by 1000 items
//Input:
//	upcoming		: Boolean (default = true)	- past/upcoming items
//	include			: Array						- list of classes to dereference 
//Output:
//	ProductOrder[]
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
Parse.Cloud.define('productOrderList', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	var
		now = moment.utc().startOf('day');
	
	var upcoming = !_.requestParamExists(request, 'upcoming') || request.params.upcoming === true;
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('ProductOrder');
			
			query.include(_.parseQueryInclude(request.params.include));
			
			if (upcoming) {
				
				query.greaterThanOrEqualTo('dateFrom', now.toDate());
				query.ascending('dateFrom');
				
			} else {
				
				query.lessThan('dateFrom', now.toDate());
				query.descending('dateFrom');
				
			}
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {})
			
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// productOrderRefund - refund order
//
//Input:
//	productOrder	: Id (required) - ProductOrder Id
//Output:
//	Boolean
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	ACCESS_DENIED
//	PRODUCT_ORDER_IS_NOT_AVAILABLE
//	PRODUCT_ORDER_IS_NOT_CHARGED
//	PRODUCT_ORDER_IS_ALREADY_REFUNDED
//	PRODUCT_ORDER_UPDATE_FAILED
Parse.Cloud.define('productOrderRefund', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString(true));
	
	if (!(_.requestParamExists(request, 'productOrder') && _.isParseId(request.params.productOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'productOrder'}).toString(true));
	
	var productOrder, refundResponse, reverseService, reverseResponse;

	checkUserRole(request.user, ROLE_ADMIN).then(
		
		function () {
	
			var query = new Parse.Query('ProductOrder');
			return query.get(request.params.productOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_AVAILABLE));
				}
				
			)
			
		}
	
	).then(
	
		function (result) {
			
			productOrder = result;
			
			var productOrderState = productOrder.get('state') || [];
			
			if (!_.contains(productOrderState, PRODUCT_ORDER_STATE_CHARGED) || _.isEmpty(productOrder.get('paymentResponse')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_CHARGED));
			
			var paymentResponse = JSON.parse(productOrder.get('paymentResponse'));
			
			if (!(paymentResponse.id && paymentResponse.object === 'charge' && paymentResponse.status === 'succeeded'))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_NOT_CHARGED));
			
			if (_.contains(productOrderState, PRODUCT_ORDER_STATE_REFUNDED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_IS_ALREADY_REFUNDED));
			
			var refundRequest = {
				metadata	: {
					productOrderId	: productOrder.id
				}
			};
			
			console.log(refundRequest);
			
			productOrder.set('refundRequest', JSON.stringify(refundRequest));
			
			return Stripe.Charges.refund(paymentResponse.id, refundRequest).then(
				
				null,
				function (error) {
					console.log(error);
					return Parse.Promise.as(error)
				}
				
			);
			
		}
		
	).then(
		
		function (result) {
			
			refundResponse = result;
			
			productOrder.set('refundResponse', JSON.stringify(refundResponse instanceof ArmariumError ? refundResponse.data || {} : refundResponse));
			
			if (refundResponse.id && refundResponse.object === 'refund')
				productOrder.addUnique('state', PRODUCT_ORDER_STATE_REFUNDED);
			
			//productOrder.addUnique('state', PRODUCT_ORDER_STATE_REJECTED);
			
			return productOrder.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
				}
				
			);
				
		}
	
	).then(
		
		function (result) {
			
			productOrder = result;
			
			if (refundResponse instanceof ArmariumError)
				return Parse.Promise.error(refundResponse);
			
			reverseService = TaxCloud.reverseRequest();
			
			reverseService
				.setOrderId(productOrder.id);
				
			return reverseService.query().then(
				
				null,
				function (error) {
					return Parse.Promise.as(error)
				}
				
			);

			
		}
	
	).then(
		
		function (result) {
			
			reverseResponse = result;
			
			if (reverseService._request)
				productOrder.set('taxcloudReverseRequest', JSON.stringify(reverseService._request));
			
			if (reverseService._response)
				productOrder.set('taxcloudReverseResponse', JSON.stringify(reverseService._response));
			
			if (!(reverseResponse instanceof ArmariumError))
				productOrder.addUnique('state', PRODUCT_ORDER_STATE_TAXCLOUD_RETURNED);
			
			return productOrder.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				function () {
					
					if (reverseResponse instanceof ArmariumError)
						return Parse.Promise.error(reverseResponse);
					
					return Parse.Promise.as();
					
				},
				function(error) {
					console.log(error)
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_ORDER_UPDATE_FAILED));
				}
				
			);
			
		}
	
	).then(
		
		function() {
			
			response.success(true);
			
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString(true) : error.message);
		}
		
	);

});



////////////////////////////////////////////////////////////////////////////////
// STYLIST TODO


// stylistTutorialList - return sorted published stylist tutorial list
// - sorting have ascending order
// - items with undefined order has higher priority
// - list are limited by 1000 items
//Input:
//Output:
//	StylistTutorial[]
//Exceptions:
Parse.Cloud.define('stylistTutorialList', function(request, response) {
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('StylistTutorial');
			
			query.include(['preview']);
			query.equalTo('published', true);
			query.ascending('sortOrder');
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {})
	
		}
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// stylistList - return sorted published stylist list filtered by type (optional) with availability check (optional)
// - sorting have ascending order
// - items with undefined order has higher priority
// - list are limited by 1000 items
//Input:
//	type			: Number <StylistType> (default = Star)	- Stylist type - Star or Inhome
//	zip				: String								- Zip-code (for new release)
//	dateFrom		: Date									- start date to check availability
//	dateTill		: Date									- end date to check availability
//	include			: Array									- list of classes to dereference
//Output:
//	Stylist[]
//Exceptions:
//	DATE_RANGE_IS_NOT_VALID
Parse.Cloud.define('stylistList', function(request, response) {
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(STYLIST_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(STYLIST_AVAILABILITY_MAX);
	
	var type = _.requestParamExists(request, 'type') && _.contains(STYLIST_TYPE, request.params.type) ? request.params.type : STYLIST_TYPE_STAR;
	
	var promise = Parse.Promise.as();
	
	if (_.requestParamExists(request, 'zip')) {
		
		promise = promise.then(
			
			function () {
				
				var promises = [];
				
				var query = new Parse.Query('ZipGeoPoint');
				query.equalTo('code', request.params.zip);
				return query.first(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
			
			}
		
		).then(
			
			function (zgp) {
				
				if (!((zgp instanceof Parse.Object) && zgp.has('location') && (zgp.get('location') instanceof Parse.GeoPoint))) {
					console.log('Zip not found')
					return Parse.Promise.as([]);
				}
					
				
				var
					userLocation = zgp.get('location');
				
				var query = new Parse.Query('Stylist');
				query.include(_.parseQueryInclude(request.params.include, ['photo']));
				//query.equalTo('type', type);
				query.withinMiles('location', userLocation, STYLIST_LOOKUP_RADIUS);
				query.equalTo('published', true);
				query.ascending('sortOrder');
				query.limit(PAGINATION_LIMIT);
				return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					function (stylists) {
						
						var distance = {};
						
						_.each(stylists, function (stylist) {
							
							if (stylist.has('location') && (stylist.get('location') instanceof Parse.GeoPoint))
								distance[stylist.id] = userLocation.milesTo(stylist.get('location'));
							
						});
						
						console.log(distance);
						
						return Parse.Promise.as(_.filter(stylists, function (stylist) {
							
							return _.has(distance, stylist.id) && stylist.has('radiusToServe') && stylist.get('radiusToServe') > 0 && distance[stylist.id] <= stylist.get('radiusToServe');
							
						}));
						
					}
					
				);
				
			}
		
		);
	
	} else if (_.requestParamExists(request, 'dateFrom')) {
		
		var dateRange = new DateRange(request.params.dateFrom, _.requestParamExists(request, 'dateTill') ? request.params.dateTill : request.params.dateFrom);
		
		dateRange.limit(dateMin, dateMax, true);
	
		if (!dateRange.valid())
			return response.error(new ArmariumError(ArmariumError.DATE_RANGE_IS_NOT_VALID).toString());
		
		promise = promise.then(
			
			function () {
				
				var promises = [];
				
				var stylistQuery = new Parse.Query('Stylist');
				stylistQuery.include(_.parseQueryInclude(request.params.include, ['photo']));
				stylistQuery.equalTo('type', type);
				stylistQuery.equalTo('published', true);
				stylistQuery.ascending('sortOrder');
				stylistQuery.limit(PAGINATION_LIMIT);
				promises.push(stylistQuery.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
				
				var query = new Parse.Query('StylistAvailability');
				query.select(['stylist', 'date', 'time']);
				query.greaterThanOrEqualTo('date', dateRange.from());
				query.lessThanOrEqualTo('date', dateRange.till());
				query.matchesQuery('stylist', stylistQuery);
				query.exists('date');
				query.exists('time');
				query.ascending('date');
				query.limit(PAGINATION_LIMIT);
				promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
				
				var query = new Parse.Query('StylistOrder');
				query.include('stylist');
				query.select(['stylist', 'orderDate', 'orderTime']);
				query.greaterThanOrEqualTo('orderDate', dateRange.from());
				query.lessThanOrEqualTo('orderDate', dateRange.till());
				query.exists('stylist');
				query.ascending('orderDate');
				query.limit(PAGINATION_LIMIT);
				promises.push(query.find({useMasterKey: true}));
				
				return Parse.Promise.when(promises).then(
					
					null,
					function (errors) {
						return Parse.Promise.error(_.firstError(errors));
					}
					
				);
				
			}
		
		).then(
			
			function (result) {
				
				stylists = result[0];
				availabilities = result[1];
				orders = result[2];
				
				var availability = {};
				
				_.each(availabilities, function (availability) {
					
					var
						date = availability.get('date').valueOf(),
						stylistId = availability.get('stylist').id;
					
					if (!_.has(this, stylistId))
						this[stylistId] = {};
						
					this[stylistId][date] = availability.get('time') || [];
					
				}, availability);
				
				//console.log(JSON.stringify(availability, null, '\t'));
				
				_.each(orders, function (order) {
					
					var
						date = order.get('orderDate').valueOf(),
						stylistId = order.get('stylist').id,
						stylistType = order.get('stylist').get('type');
					
					if (_.has(this, stylistId) && stylistType === STYLIST_TYPE_STAR)
						this[stylistId][date] = _.difference(this[stylistId][date], order.get('orderTime') || []);
					
				}, availability);
				
				//console.log(JSON.stringify(availability, null, '\t'));
				
				var available = _
					.chain(availability)
					.map(function (items, stylistId) {
						
						var value = _.reduce(items, function (memo, times) {return memo + _.size(times)}, 0);
						
						return value > 0 ? stylistId : null;
						
					})
					.compact()
					.value();
				
				//console.log(JSON.stringify(available, null, '\t'));
				
				var items = _.filter(
					stylists,
					function (stylist) {
						return _.contains(this, stylist.id);
					},
					available
				);
				
				return Parse.Promise.as(items);
				
			}
		
		);
		
	} else {
		
		promise = promise.then(
			
			function () {
				
				var stylistQuery = new Parse.Query('Stylist');
				stylistQuery.include(_.parseQueryInclude(request.params.include, ['photo']));
				stylistQuery.equalTo('type', type);
				stylistQuery.equalTo('published', true);
				stylistQuery.ascending('sortOrder');
				stylistQuery.limit(PAGINATION_LIMIT);
				return stylistQuery.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
				
			}
			
		);
		
	}
	
	return promise.then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// stylistAvailability - return date ranges when stylists is available
//Input:
//	dateFrom		: Date (required)	- start date range
//	dateTill		: Date (required)	- end date range
//Output:
//	DateRange[]
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
//	DATE_RANGE_IS_NOT_VALID
Parse.Cloud.define('stylistAvailability', function(request, response) {
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(STYLIST_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(STYLIST_AVAILABILITY_MAX);
	
	var dateRange = new DateRange(request.params.dateFrom, request.params.dateTill);
	
	if (!dateRange.defined())
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'dateFrom or dateTill'}).toString());
	
	dateRange.limit(dateMin, dateMax, true);
	
	if (!dateRange.valid())
		return response.error(new ArmariumError(ArmariumError.DATE_RANGE_IS_NOT_VALID).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var stylistQuery = new Parse.Query('Stylist');
			stylistQuery.equalTo('published', true);
			stylistQuery.limit(PAGINATION_LIMIT);
			
			var promises = [];
			
			var query = new Parse.Query('StylistAvailability');
			query.select(['stylist', 'date', 'time']);
			query.greaterThanOrEqualTo('date', dateRange.from());
			query.lessThanOrEqualTo('date', dateRange.till());
			query.matchesQuery('stylist', stylistQuery);
			query.exists('date');
			query.exists('time');
			query.ascending('date');
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			var query = new Parse.Query('StylistOrder');
			query.include('stylist');
			query.select(['stylist', 'orderDate', 'orderTime']);
			query.greaterThanOrEqualTo('orderDate', dateRange.from());
			query.lessThanOrEqualTo('orderDate', dateRange.till());
			query.exists('stylist');
			query.ascending('orderDate');
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find({useMasterKey: true}));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			
			availabilities = result[0];
			orders = result[1];
			
			var availability = {};
			
			_.each(availabilities, function (availability) {
				
				var
					date = availability.get('date').valueOf(),
					stylistId = availability.get('stylist').id;
				
				if (!_.has(this, date))
					this[date] = {};
					
				this[date][stylistId] = availability.get('time') || [];
				
			}, availability);
			
			//console.log(JSON.stringify(availability));
			
			_.each(orders, function (order) {
				
				var
					date = order.get('orderDate').valueOf(),
					stylistId = order.get('stylist').id,
					stylistType = order.get('stylist').get('type');
				
				if (_.has(this, date) && stylistType === STYLIST_TYPE_STAR)
					this[date][stylistId] = _.difference(this[date][stylistId], order.get('orderTime') || []);
				
			}, availability);
			
			//console.log(JSON.stringify(availability));
			
			var available = _
				.chain(availability)
				.map(function (items, date) {
					
					var value = _.reduce(items, function (memo, times) {return memo + _.size(times)}, 0);
					
					return value > 0 ? Number(date) : null;
					
				})
				.compact()
				.value();
			
			//console.log(JSON.stringify(_.map(available, function (date) {return moment.utc(date).format('YYYY-MM-DD');})));
			
			var ranges = [];
			
			// Skip if no dates available
			if (!_.isEmpty(available))
				ranges.push(_.reduce(available, function (memo, value) {
	  
					if (!_.isNull(memo)) {
						
						if (value - memo.till === 24 * 60 * 60 * 1000) {

							memo.till = value;
							memo.items.push(value);
							memo.count++;
							
						} else {
							this.push(memo);
							memo = null;
						}
						
					}
					
					if (_.isNull(memo))
						memo = {from: value, till: value, items: [value], count: 1};
						
					return memo;
					
				}, null, ranges));

			//console.log(JSON.stringify(_.map(ranges, function (range) {return {from: moment.utc(range.from).format('YYYY-MM-DD'), till: moment.utc(range.till).format('YYYY-MM-DD')};})));
			
			available = _.map(ranges, function (item) {
				
				item.from = moment.utc(item.from).toDate();
				item.till = moment.utc(item.till).toDate();
				item.items = _.map(item.items, function (ts) {return moment.utc(ts).toDate();});
				return item;
				
			});

			//console.log(JSON.stringify(available));
			
			return Parse.Promise.as(available);
				 
		}
		
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// stylistLookup - return available time range for specified stylist and date or rent amount for time range
// - stylist should be published
//Input:
//	stylist			: Id (required)		- Stylist Id
//	date			: Date (required)	- date
//	time			: Array				- time range
//Output:
//					: Array <TimeRange>	- time range
//					(or)
//					: Number			- total amount
//Exceptions:
//	PARAM_IS_NOT_SPECIFIED
//	DATE_IS_NOT_VALID
//	STYLIST_IS_NOT_AVAILABLE
Parse.Cloud.define('stylistLookup', function(request, response) {
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(STYLIST_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(STYLIST_AVAILABILITY_MAX);
	
	if (!(_.requestParamExists(request, 'stylist') && _.isParseId(request.params.stylist)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'stylist'}).toString());
	
	var dateRange = new DateRange(request.params.date, request.params.date);
	
	if (!dateRange.defined())
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'date'}).toString());
	
	dateRange.limit(dateMin, dateMax, true);
	
	if (!dateRange.valid())
		return response.error(new ArmariumError(ArmariumError.DATE_IS_NOT_VALID).toString());
	
	Parse.Promise.as().then(
		
		function () {
		
			var promises = [];
			
			var stylistQuery = new Parse.Query('Stylist');
			stylistQuery.equalTo('objectId', request.params.stylist);
			stylistQuery.equalTo('published', true);
			promises.push(stylistQuery.first(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			var query = new Parse.Query('StylistAvailability');
			query.select(['time']);
			query.equalTo('date', dateRange.from());
			query.matchesQuery('stylist', stylistQuery);
			query.exists('time');
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			var query = new Parse.Query('StylistOrder');
			query.select(['orderTime']);
			query.equalTo('orderDate', dateRange.from());
			query.matchesQuery('stylist', stylistQuery);
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find({useMasterKey: true}));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			
			stylist = result[0];
			availabilities = result[1];
			orders = result[2];
			
			if (!(stylist instanceof Parse.Object))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_IS_NOT_AVAILABLE));
			
			var availability = _.reduce(availabilities, function (memo, availability) {
				
				return _.union(memo, availability.get('time') || []);
				
			}, []);
			
			//console.log(JSON.stringify(availability, null, '\t'));
			
			var available;
			
			if (stylist.get('type') === STYLIST_TYPE_STAR)
			
				available = _.reduce(orders, function (memo, order) {
					
					return _.difference(memo, order.get('orderTime') || []);
					
				}, availability);
			
			else
				available = availability;
			
			//console.log(JSON.stringify(available, null, '\t'));
			
			if (_.requestParamExists(request, 'time') && _.isArray(request.params.time)) {
				
				var
					time = request.params.time,
					length = _.size(time),
					price = stylist.get('price') || 0;
				
				if (_.equal(_.intersection(available, time), time))
					return Parse.Promise.as(price);
					
				else
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_IS_NOT_AVAILABLE));
				
			} else {
				
				var timeRanges = _.map(available, function (value) {
					
					return {
						value	: [value],
						text	: dateRange.from(true).startOf('day').hours(value).format(TIME_FORMAT) + ' - ' + dateRange.from(true).startOf('day').hours(value + 1).format(TIME_FORMAT)
					};
					
				});
				
				return Parse.Promise.as(timeRanges);
				
			}
				
			
		}
		
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// stylistBooking - book and return stylist order
//Input:
//	stylist			: Id				- Stylist Id
//	date			: Date (required)	- order date
//	shippingAddress	: Id (required?)	- ShippingAddress Id, required if showroom parameter is not specified
//	showroom		: Id (required?)	- Showroom Id, required if shippingAddress parameter is not specified
//Output:
//					: StylistOrder		- created order
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	DATE_IS_NOT_VALID
//	STYLIST_IS_NOT_AVAILABLE
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
//	SHOWROOM_IS_NOT_AVAILABLE
//	STYLIST_ORDER_CONFIRM_FAILED
//	STYLIST_ORDER_CREATE_FAILED
//	STYLIST_ORDER_IS_NOT_AVAILABLE
Parse.Cloud.define('stylistBooking', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(STYLIST_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(STYLIST_AVAILABILITY_MAX);
	
	var dateRange = new DateRange(request.params.date, request.params.date);
	
	if (!dateRange.defined())
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'date'}).toString());
	
	dateRange.limit(dateMin, dateMax, true);
	
	if (!dateRange.valid())
		return response.error(new ArmariumError(ArmariumError.DATE_IS_NOT_VALID).toString());
		
	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
			
			var query = new Parse.Query('Stylist');
			query.equalTo('published', true);
			
			if (_.requestParamExists(request, 'stylist') && _.isParseId(request.params.stylist)) {
				
				promises.push(query.get(request.params.stylist, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						console.log(error);
						return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_IS_NOT_AVAILABLE));
					}
					
				));
			
			} else {
				
				query.equalTo('type', STYLIST_TYPE_INHOME);
				query.ascending('sortOrder');
				promises.push(query.first(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
				
			}
			
			if (_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)) {
				
				var query = new Parse.Query('ShippingAddress');
				promises.push(query.get(request.params.shippingAddress, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
					}
					
				));
				
			} else
				promises.push(Parse.Promise.as(null));
			
			if (_.requestParamExists(request, 'showroom') && _.isParseId(request.params.showroom)) {
				
				var query = new Parse.Query('Showroom');
				query.equalTo('published', true);
				promises.push(query.get(request.params.showroom, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.SHOWROOM_IS_NOT_AVAILABLE));
					}
					
				));
			
			} else
				promises.push(Parse.Promise.as(null));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
		
		}
	
	).then(
		
		function (result) {
			
			stylist = result[0];
			shippingAddress = result[1];
			showroom = result[2];
			
			if (!(stylist instanceof Parse.Object))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_IS_NOT_AVAILABLE));
			
			var stylistOrder = new Parse.Object('StylistOrder');
			
			if (shippingAddress instanceof Parse.Object) {
				
				stylistOrder.set('shippingAddress', shippingAddress);
				stylistOrder.unset('showroom');
				
			} else if (showroom instanceof Parse.Object) {
				
				stylistOrder.set('showroom', showroom);
				stylistOrder.unset('shippingAddress');
				
			}
			
			if (!(stylistOrder.has('shippingAddress') || stylistOrder.has('showroom')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CONFIRM_FAILED, 'Order has no specified shippingAddress or showroom'));
			
			stylistOrder.set('orderNumber', stylistOrderNumberGenerate(now));
			stylistOrder.set('user', request.user);
			stylistOrder.set('stylist', stylist);
			stylistOrder.set('orderDate', dateRange.from());
			
			stylistOrder.addUnique('state', STYLIST_ORDER_STATE_BOOKED);
			stylistOrder.addUnique('state', STYLIST_ORDER_STATE_CONFIRMED);
			
			stylistOrder.set('searchable', [stylistOrder.get('orderNumber')]);
			stylistOrder.set('indexedAt', moment.utc().toDate());
			
			return stylistOrder.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CREATE_FAILED));
				}
				
			);
			
		}
		
	).then(
		
		function (stylistOrder) {
			
			var query = new Parse.Query('StylistOrder');
			query.include(['user', 'shippingAddress', 'showroom', 'paymentCard', 'stylist']);
			return query.get(stylistOrder.id, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function(stylistOrder) {
			
			response.success(stylistOrder);
			
			/*var params = {
				Data				: serializer.serialize(stylistOrder, 'StylistOrder', true),
				AddRecipientsToList	: false
			};
			
			var recipients = [];
			
			if (request.user.has('email'))
				recipients.push(request.user.get('email'));
				
			if (!_.isEmpty(CM_STYLIST_ORDER_BCC))
				recipients.push(CM_STYLIST_ORDER_BCC);
			
			recipients = _.object(_.first(['To', 'BCC'], _.size(recipients)), recipients);
			
			if (_.isEmpty(recipients))
				return response.success(stylistOrder);
				
			params = _.defaults(params, recipients);
			
			return CampaignMonitor.Transactional.smartEmailSend(
				
				CM_NOTIFICATION_TYPE_STYLIST_ORDER_CONFIRMED,
				params
				
			).then(
				
				function () {
					response.success(stylistOrder);
				},
				function (error) {
					console.log(error);
					response.success(stylistOrder);
				}
				
			);*/
			
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// stylistOrderCreate - create/update and return stylist order
//Input:
//	stylist			: Id (required)		- Stylist Id
//	date			: Date (required)	- order date
//	time			: Array (required)	- time range
//	(or)
//	stylistOrder	: Id (required) - StylistOrder Id
//	time			: Array (required)	- time range
//Output:
//					: StylistOrder		- created order
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	STYLIST_ORDER_IS_NOT_AVAILABLE
//	STYLIST_ORDER_CREATE_FAILED
//	DATE_IS_NOT_VALID
//	STYLIST_IS_NOT_AVAILABLE
Parse.Cloud.define('stylistOrderCreate', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	var
		now = moment.utc().startOf('day'),
		dateMin = moment.utc(now).add(STYLIST_AVAILABILITY_MIN),
		dateMax = moment.utc(now).add(STYLIST_AVAILABILITY_MAX);
	
	if (!(_.requestParamExists(request, 'time') && _.isArray(request.params.time)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'time'}).toString());
	
	var stylist, prevStylistOrder, newStylistOrder, dateRange;

	var promise = Parse.Promise.as();
	
	if (_.requestParamExists(request, 'stylistOrder') && _.isParseId(request.params.stylistOrder)) {
		
		promise = promise.then(
			
			function () {
				
				var query = new Parse.Query('StylistOrder');
				query.include('stylist');
				return query.get(request.params.stylistOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
					}
					
				);
				
			}
			
		).then(
			
			function (result) {
				
				prevStylistOrder = result;
				
				stylist = prevStylistOrder.get('stylist');
				
				dateRange = new DateRange(prevStylistOrder.get('orderDate'), prevStylistOrder.get('orderDate'));
				
				var stylistOrder = prevStylistOrder.clone();
				
				stylistOrder.set('orderTime', request.params.time);
				
				return stylistOrder.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CREATE_FAILED));
					}
					
				);
				
			}
			
		);
		
	} else if (_.requestParamExists(request, 'stylist') && _.isParseId(request.params.stylist)) {
		
		dateRange = new DateRange(request.params.date, request.params.date);
		
		if (!dateRange.defined())
			return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'date'}).toString());
		
		dateRange.limit(dateMin, dateMax, true);
		
		if (!dateRange.valid())
			return response.error(new ArmariumError(ArmariumError.DATE_IS_NOT_VALID).toString());
		
		promise = promise.then(
			
			function() {
				
				var query = new Parse.Query('Stylist');
				
				query.equalTo('published', true);
				
				return query.get(request.params.stylist, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						console.log(error);
						return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_IS_NOT_AVAILABLE));
					}
					
				);
	
			}
			
		).then(
			
			function(result) {
			
				stylist = result;
				
				var
					totalPrice = stylist.get('price') || 0;
				
				if (!(totalPrice > 0))
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_IS_NOT_AVAILABLE));
				
				var stylistOrder = new Parse.Object('StylistOrder');
				
				stylistOrder.set('orderNumber', stylistOrderNumberGenerate(now));
				stylistOrder.set('user', request.user);
				stylistOrder.set('stylist', stylist);
				stylistOrder.set('orderDate', dateRange.from());
				stylistOrder.set('orderTime', request.params.time);
				
				stylistOrder.set('totalPrice', totalPrice);
				
				stylistOrder.set('searchable', [stylistOrder.get('orderNumber')]);
				stylistOrder.set('indexedAt', moment.utc().toDate());
				
				return stylistOrder.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CREATE_FAILED));
					}
					
				);
				
			}
		
		);
		
	} else
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'stylist or stylistOrder'}).toString());
	
	promise = promise.then(
		
		function (result) {
			
			newStylistOrder = result;
			
			var promises = [];
			
			var query = new Parse.Query('StylistAvailability');
			query.select(['time']);
			query.equalTo('date', dateRange.from());
			query.equalTo('stylist', stylist);
			query.exists('time');
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}));
			
			var query = new Parse.Query('StylistOrder');
			query.select(['orderTime']);
			query.equalTo('orderDate', dateRange.from());
			query.equalTo('stylist', stylist);
			query.limit(PAGINATION_LIMIT);
			promises.push(query.find({useMasterKey: true}));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				} 
				
			);
			
		}
	
	).then(
		
		function (result) {
			
			availabilities = result[0];
			orders = result[1];
			
			var availability = _.reduce(availabilities, function (memo, availability) {
				
				return _.union(memo, availability.get('time') || []);
				
			}, []);
			
			//console.log(JSON.stringify(availability, null, '\t'));
			
			var available;
			
			if (stylist.get('type') === STYLIST_TYPE_STAR)
			
				available = _.reduce(orders, function (memo, order) {
					
					return _.difference(memo, order.id !== newStylistOrder.id ? order.get('orderTime') || [] : []);
					
				}, availability);
			
			else
				
				available = availability;
			
			//console.log(JSON.stringify(available, null, '\t'));
			
			var
				time = newStylistOrder.get('orderTime'),
				length = _.size(time);
			
			if (_.equal(_.intersection(available, time), time)) {
				
				if (prevStylistOrder instanceof Parse.Object)
					return prevStylistOrder.destroy({useMasterKey: true}).then(
						
						function () {
							return Parse.Promise.as();
						},
						function(error) {
							console.log(error);
							return Parse.Promise.as();
						}
						
					);
				
				else
					return Parse.Promise.as();
				
			}
			
			return newStylistOrder.destroy({useMasterKey: true}).then(
				
				function () {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_IS_NOT_AVAILABLE));
				},
				function(error) {
					console.log(error);
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_IS_NOT_AVAILABLE));
				}
				
			);

		}
		
	).then(
		
		function() {
			response.success(newStylistOrder);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// stylistOrderRelease - release stylist order
//
//Input:
//	stylistOrder	: Id (required) - StylistOrder Id
//Output:
//					: Boolean		- release result
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	STYLIST_ORDER_IS_NOT_AVAILABLE
//	STYLIST_ORDER_REMOVE_FAILED
Parse.Cloud.define('stylistOrderRelease', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'stylistOrder') && _.isParseId(request.params.stylistOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'stylistOrder'}).toString());

	Parse.Promise.as().then(
		
		function () {
	
			var query = new Parse.Query('StylistOrder');
			return query.get(request.params.stylistOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
	
		function (stylistOrder) {
			
			if (_.contains(stylistOrder.get('state') || [], STYLIST_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_REMOVE_FAILED));
			
			return stylistOrder.destroy({useMasterKey: true}).then(
				
				function () {
					return Parse.Promise.as(true);
				},
				function () {
					return Parse.Promise.as(false);
				}
				
			);
			
		}
		
	).then(
		
		function(result) {
			response.success(result);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// stylistOrderSetShippingAddress - update shipping address for order
// - setting shippingAddress, causes unsetting showroom 
//Input:
//	stylistOrder	: Id (required) - StylistOrder Id
//	shippingAddress	: Id			- ShippingAddress Id, unset order's shippingAddress if not specified
//Output:
//					: StylistOrder	- If success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	STYLIST_ORDER_IS_NOT_AVAILABLE
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
//	STYLIST_ORDER_UPDATE_FAILED
Parse.Cloud.define('stylistOrderSetShippingAddress', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'stylistOrder') && _.isParseId(request.params.stylistOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'stylistOrder'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
	
			var query = new Parse.Query('StylistOrder');
			promises.push(query.get(request.params.stylistOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
				}
				
			));
			
			if (_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)) {
				
				var query = new Parse.Query('ShippingAddress');
				promises.push(query.get(request.params.shippingAddress, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
					}
					
				));
				
			} else
				promises.push(Parse.Promise.as(null));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
	
		function (result) {
			
			stylistOrder = result[0];
			shippingAddress = result[1];
			
			if (_.contains(stylistOrder.get('state') || [], STYLIST_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_UPDATE_FAILED));
			
			if (shippingAddress instanceof Parse.Object) {
				stylistOrder.set('shippingAddress', shippingAddress);
				stylistOrder.unset('showroom');
				
			} else
				stylistOrder.unset('shippingAddress');
			
			return stylistOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_UPDATE_FAILED));
				}
				
			);
			
		}
		
	).then(
		
		function(stylistOrder) {
			response.success(stylistOrder);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// stylistOrderSetShowroom - update showroom for order
// - setting showroom, causes unsetting shippingAddress
//Input:
//	stylistOrder	: Id (required) - StylistOrder Id
//	showroom		: Id			- Showroom Id, unset order's showroom if not specified 
//Output:
//					: StylistOrder	- If success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	STYLIST_ORDER_IS_NOT_AVAILABLE
//	SHOWROOM_IS_NOT_AVAILABLE
//	STYLIST_ORDER_UPDATE_FAILED
Parse.Cloud.define('stylistOrderSetShowroom', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'stylistOrder') && _.isParseId(request.params.stylistOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'stylistOrder'}).toString());
	
	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
	
			var query = new Parse.Query('StylistOrder');
			promises.push(query.get(request.params.stylistOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
				}
				
			));
			
			if (_.requestParamExists(request, 'showroom') && _.isParseId(request.params.showroom)) {
				
				var query = new Parse.Query('Showroom');
				promises.push(query.get(request.params.showroom, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.SHOWROOM_IS_NOT_AVAILABLE));
					}
					
				));
			
			} else
				promises.push(Parse.Promise.as(null));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
	
		function (result) {
			
			stylistOrder = result[0];
			showroom = result[1];
			
			if (_.contains(stylistOrder.get('state') || [], STYLIST_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_UPDATE_FAILED));
			
			if (showroom instanceof Parse.Object) {
				
				stylistOrder.set('showroom', showroom);
				stylistOrder.unset('shippingAddress');
			
			} else
				stylistOrder.unset('showroom');
			
			return stylistOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_UPDATE_FAILED));
				}
				
			);
			
		}
		
	).then(
		
		function(stylistOrder) {
			response.success(stylistOrder);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// stylistOrderSetPaymentCard - update payment card for order
//
//Input:
//	stylistOrder	: Id (required) - StylistOrder Id
//	paymentCard		: Id (required)	- PaymentCard Id
//Output:
//					: StylistOrder	- If success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	STYLIST_ORDER_IS_NOT_AVAILABLE
//	PAYMENT_CARD_IS_NOT_AVAILABLE
//	STYLIST_ORDER_UPDATE_FAILED
Parse.Cloud.define('stylistOrderSetPaymentCard', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'stylistOrder') && _.isParseId(request.params.stylistOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'stylistOrder'}).toString());
	
	if (!(_.requestParamExists(request, 'paymentCard') && _.isParseId(request.params.paymentCard)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'paymentCard'}).toString());

	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
	
			var query = new Parse.Query('StylistOrder');
			query.equalTo('user', request.user);
			promises.push(query.get(request.params.stylistOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
				}
				
			));
			
			var query = new Parse.Query('PaymentCard');
			promises.push(query.get(request.params.paymentCard, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PAYMENT_CARD_IS_NOT_AVAILABLE));
				}
				
			));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
			
		}
	
	).then(
		
		function (result) {
			
			stylistOrder = result[0];
			paymentCard = result[1];
			
			if (_.contains(stylistOrder.get('state') || [], STYLIST_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_UPDATE_FAILED));
			
			stylistOrder.set('paymentCard', paymentCard);
			
			return stylistOrder.save(null, {useMasterKey: true}).then(
				
				null,
				function (error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_UPDATE_FAILED));
				}
				
			);
			
		}
		
	).then(
		
		function(stylistOrder) {
			response.success(stylistOrder);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// stylistOrderConfirm - confirm order and make payment
//
//Input:
//	stylistOrder	: Id (required) - StylistOrder Id
//	paymentCard		: Id (required)	- PaymentCard Id
//	shippingAddress	: Id (required?)- ShippingAddress Id, required if showroom parameter is not specified
//	showroom		: Id (required?)- Showroom Id, required if shippingAddress parameter is not specified
//Output:
//					: StylistOrder	- If success
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	STYLIST_ORDER_IS_NOT_AVAILABLE
//	PAYMENT_CARD_IS_NOT_AVAILABLE
//	SHIPPING_ADDRESS_IS_NOT_AVAILABLE
//	SHOWROOM_IS_NOT_AVAILABLE
//	STYLIST_ORDER_IS_ALREADY_CHARGED
//	STYLIST_ORDER_CONFIRM_FAILED
//	STRIPE_*
Parse.Cloud.define('stylistOrderConfirm', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	if (!(_.requestParamExists(request, 'stylistOrder') && _.isParseId(request.params.stylistOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'stylistOrder'}).toString());
	
	if (!(_.requestParamExists(request, 'paymentCard') && _.isParseId(request.params.paymentCard)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'paymentCard'}).toString());
		
	var stylistOrder, paymentResponse;
	
	Parse.Promise.as().then(
		
		function () {
			
			var promises = [];
			
			var query = new Parse.Query('StylistOrder');
			query.include(['user', 'paymentCard', 'stylist']);
			query.equalTo('user', request.user);
			promises.push(query.get(request.params.stylistOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
				}
				
			));
			
			var query = new Parse.Query('PaymentCard');
			promises.push(query.get(request.params.paymentCard, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PAYMENT_CARD_IS_NOT_AVAILABLE));
				}
				
			));
			
			if (_.requestParamExists(request, 'shippingAddress') && _.isParseId(request.params.shippingAddress)) {
				
				var query = new Parse.Query('ShippingAddress');
				promises.push(query.get(request.params.shippingAddress, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.SHIPPING_ADDRESS_IS_NOT_AVAILABLE));
					}
					
				));
				
			} else
				promises.push(Parse.Promise.as(null));
			
			if (_.requestParamExists(request, 'showroom') && _.isParseId(request.params.showroom)) {
				
				var query = new Parse.Query('Showroom');
				query.equalTo('published', true);
				promises.push(query.get(request.params.showroom, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
					
					null,
					function(error) {
						return Parse.Promise.error(new ArmariumError(ArmariumError.SHOWROOM_IS_NOT_AVAILABLE));
					}
					
				));
			
			} else
				promises.push(Parse.Promise.as(null));
			
			return Parse.Promise.when(promises).then(
				
				null,
				function (errors) {
					return Parse.Promise.error(_.firstError(errors));
				}
				
			);
		
		}
	
	).then(
		
		function (result) {
			
			stylistOrder = result[0];
			paymentCard = result[1];
			shippingAddress = result[2];
			showroom = result[3];
			
			if (_.contains(stylistOrder.get('state') || [], STYLIST_ORDER_STATE_CHARGED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_ALREADY_CHARGED));
			
			if (!(stylistOrder.has('user') && (user = stylistOrder.get('user')) && user.has('stripeCustomerId')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CONFIRM_FAILED, 'Order has no specified payment card'));
			
			if (!stylistOrder.has('stylist'))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CONFIRM_FAILED, 'Order has no specified stylist'));
			
			if (!(stylistOrder.has('orderDate') && stylistOrder.has('orderTime')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CONFIRM_FAILED, 'Order has no specified date and/or time'));
				
			if (paymentCard instanceof Parse.Object)
				stylistOrder.set('paymentCard', paymentCard);
			
			if (shippingAddress instanceof Parse.Object) {
				
				stylistOrder.set('shippingAddress', shippingAddress);
				stylistOrder.unset('showroom');
				
			} else if (showroom instanceof Parse.Object) {
				
				stylistOrder.set('showroom', showroom);
				stylistOrder.unset('shippingAddress');
				
			}
			
			if (!(stylistOrder.has('paymentCard') && (paymentCard = stylistOrder.get('paymentCard')) && paymentCard.has('stripeCardId')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CONFIRM_FAILED, 'Order has no specified payment card'));
			
			if (!(stylistOrder.has('shippingAddress') || stylistOrder.has('showroom')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_CONFIRM_FAILED, 'Order has no specified shippingAddress or showroom'));
			
			var
				user				= stylistOrder.get('user'),
				paymentCard			= stylistOrder.get('paymentCard'),
				stripeCustomerId	= user.get('stripeCustomerId'),
				stripeCardId		= paymentCard.get('stripeCardId'),
				totalPrice			= stylistOrder.get('totalPrice') || 0,
				orderDate			= moment.utc(stylistOrder.get('orderDate')).format('MM/DD/YYYY'),
				orderTime			= stylistOrderTimeBuild(stylistOrder);
				
			var paymentRequest = {
				amount		: Math.round(totalPrice * 100),
				currency	: ARMARIUM_DEFAULT_CURRENCY,
				customer	: stripeCustomerId,
				source		: stripeCardId,
				description	: 'Payment for stylist "' + (stylistOrder.get('stylist').get('fullName') || '') + '" on ' + orderDate + ' ' + orderTime.join(', '),
				metadata	: {
					userId			: user.id,
					stylistOrderId	: stylistOrder.id,
					orderDate		: orderDate,
					orderTime		: orderTime.join(', ')
				}
			};
			
			console.log(paymentRequest);
			
			stylistOrder.set('totalPrice', totalPrice);
			stylistOrder.set('paymentRequest', JSON.stringify(paymentRequest));
			
			return Stripe.Charges.create(paymentRequest).then(
				
				null,
				function (error) {
					console.log(error);
					return Parse.Promise.as(error)
				}
				
			);
			
		}
		
	).then(
		
		function (result) {
			
			paymentResponse = result;
			
			stylistOrder.set('paymentResponse', JSON.stringify(paymentResponse instanceof ArmariumError ? paymentResponse.data || {} : paymentResponse));
			
			if (paymentResponse.id && paymentResponse.object === 'charge' && paymentResponse.status === 'succeeded')
				stylistOrder.addUnique('state', STYLIST_ORDER_STATE_CHARGED);
			
			stylistOrder.addUnique('state', STYLIST_ORDER_STATE_CONFIRMED);
			
			return stylistOrder.save(null, {useMasterKey: true});
				
		}
	
	).then(
		
		function (stylistOrder) {
			
			var query = new Parse.Query('StylistOrder');
			query.include(['user', 'shippingAddress', 'showroom', 'paymentCard', 'stylist']);
			return query.get(stylistOrder.id, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
				}
				
			);
			
		}
	
	).then(
		
		function(stylistOrder) {
			
			if (paymentResponse instanceof ArmariumError)
				return response.error(paymentResponse.toString());
			
			response.success(stylistOrder);
			
			/*var params = {
				Data				: serializer.serialize(stylistOrder, 'StylistOrder', true),
				AddRecipientsToList	: false
			};
			
			var recipients = [];
			
			if (request.user.has('email'))
				recipients.push(request.user.get('email'));
				
			if (!_.isEmpty(CM_STYLIST_ORDER_BCC))
				recipients.push(CM_STYLIST_ORDER_BCC);
			
			recipients = _.object(_.first(['To', 'BCC'], _.size(recipients)), recipients);
			
			if (_.isEmpty(recipients))
				return response.success(stylistOrder);
				
			params = _.defaults(params, recipients);
			
			return CampaignMonitor.Transactional.smartEmailSend(
				
				CM_NOTIFICATION_TYPE_STYLIST_ORDER_CONFIRMED,
				params
				
			).then(
				
				function () {
					response.success(stylistOrder);
				},
				function (error) {
					console.log(error);
					response.success(stylistOrder);
				}
				
			);*/
			
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);

});


// stylistOrderList - return stylist order list
// - items sorted by orderDate
// - sorting have ascending order for upcoming items and descending order for past items
// - list are limited by 1000 items
//Input:
//	upcoming		: Boolean (default = true)	- past/upcoming items
//	include			: Array						- list of classes to dereference 
//Output:
//	StylistOrder[]
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
Parse.Cloud.define('stylistOrderList', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString());
	
	var
		now = moment.utc().startOf('day');
	
	var upcoming = !_.requestParamExists(request, 'upcoming') || request.params.upcoming === true;
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query('StylistOrder');
			
			query.include(_.parseQueryInclude(request.params.include));
			
			if (upcoming) {
				
				query.greaterThanOrEqualTo('orderDate', now.toDate());
				query.ascending('orderDate');
				
			} else {
				
				query.lessThan('orderDate', now.toDate());
				query.descending('orderDate');
				
			}
			query.limit(PAGINATION_LIMIT);
			
			return query.find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {})
			
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
		
	);
	
});


// stylistOrderRefund - refund order
//
//Input:
//	stylistOrder	: Id (required) - StylistOrder Id
//Output:
//	Boolean
//Exceptions:
//	AUTHORIZATION_IS_REQUIRED
//	PARAM_IS_NOT_SPECIFIED
//	ACCESS_DENIED
//	STYLIST_ORDER_IS_NOT_AVAILABLE
//	STYLIST_ORDER_IS_NOT_CHARGED
//	STYLIST_ORDER_IS_ALREADY_REFUNDED
//	Failed to refund order.
Parse.Cloud.define('stylistOrderRefund', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error(new ArmariumError(ArmariumError.AUTHORIZATION_IS_REQUIRED).toString(true));
	
	if (!(_.requestParamExists(request, 'stylistOrder') && _.isParseId(request.params.stylistOrder)))
		return response.error(new ArmariumError(ArmariumError.PARAM_IS_NOT_SPECIFIED, null, {name: 'stylistOrder'}).toString(true));
	
	var stylistOrder, refundResponse;

	checkUserRole(request.user, ROLE_ADMIN).then(
		
		function () {
	
			var query = new Parse.Query('StylistOrder');
			return query.get(request.params.stylistOrder, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				null,
				function(error) {
					return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_AVAILABLE));
				}
				
			)
			
		}
	
	).then(
	
		function (result) {
			
			stylistOrder = result;
			
			var stylistOrderState = stylistOrder.get('state') || [];
			
			if (!_.contains(stylistOrderState, STYLIST_ORDER_STATE_CHARGED) || _.isEmpty(stylistOrder.get('paymentResponse')))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_CHARGED));
			
			var paymentResponse = JSON.parse(stylistOrder.get('paymentResponse'));
			
			if (!(paymentResponse.id && paymentResponse.object === 'charge' && paymentResponse.status === 'succeeded'))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_NOT_CHARGED));
			
			if (_.contains(stylistOrderState, STYLIST_ORDER_STATE_REFUNDED))
				return Parse.Promise.error(new ArmariumError(ArmariumError.STYLIST_ORDER_IS_ALREADY_REFUNDED));
			
			var refundRequest = {
				metadata	: {
					stylistOrderId	: stylistOrder.id
				}
			};
			
			console.log(refundRequest);
			
			stylistOrder.set('refundRequest', JSON.stringify(refundRequest));
			
			return Stripe.Charges.refund(paymentResponse.id, refundRequest).then(
				
				null,
				function (error) {
					console.log(error);
					return Parse.Promise.as(error)
				}
				
			);
			
		}
		
	).then(
		
		function (result) {
			
			refundResponse = result;
			
			stylistOrder.set('refundResponse', JSON.stringify(refundResponse instanceof ArmariumError ? refundResponse.data || {} : refundResponse));
			
			if (refundResponse.id && refundResponse.object === 'refund')
				stylistOrder.addUnique('state', STYLIST_ORDER_STATE_REFUNDED);
			
			//stylistOrder.addUnique('state', STYLIST_ORDER_STATE_REJECTED);
			
			return stylistOrder.save(null, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {});
				
		}
		
	).then(
		
		function() {
			
			if (refundResponse instanceof ArmariumError)
				return response.error(refundResponse.toString(true));
				
			response.success(true);
  		},
  		function(error) {
			response.error(error instanceof ArmariumError ? error.toString(true) : error.message);
		}
		
	);

});


// List push notifications
//
// Input:
//	page: Number
//	limit: Number
// Exceptions:
//	No admin role found
//	No editor role found
//	Not enough privileges to perform this operation
//	User not found
//	Failed to grant/revoke role to user
Parse.Cloud.define('listPushNotification', function(request, response) {
	
	if (!(request.user instanceof Parse.User))
		return response.error('Access denied');
	
	var
		skip = _.has(request.params, 'page') && _.isNumber(request.params.page) && request.params.page >= 0 ? request.params.page : 0,
		limit = _.has(request.params, 'limit') && _.isNumber(request.params.limit) && request.params.limit > 0 ? request.params.limit : 100;
	
	var promises = [];
	
	var query = new Parse.Query(Parse.Role);
	query.equalTo('name', ROLE_ADMIN);
	query.equalTo('users', request.user);
	promises.push(query.first({useMasterKey: true}));
	
	Parse.Promise.when(promises).then(
		
		function (result) {
			
			admin = result[0];
			
			if (!(admin instanceof Parse.Role))
				return Parse.Promise.error(new Parse.Error(null, 'Not enough privileges to perform this operation'));
			
			return Push.fetchPushNotifications('all', request.params.page, request.params.limit);
		
		}
	
	).then(
		
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error.message);
		}
		
	);
	
});


//Send push notification to users
//
// Input:
//	message		: String (required) - Text to send
//	countries	: Array (required)	- Restrict recipients by countries
//	url			: String			- URL to send
// Exceptions:
//	Access denied
//	Message is not specified
//	Countries is not specified
Parse.Cloud.define('sendPushNotification', function(request, response) {

	if (!(request.user instanceof Parse.User))
		return response.error('User not authorized');
	
	if (!_.has(request.params, 'message') || _.isEmpty(request.params.message))
		return response.error('Message is not specified');
	
	Parse.Promise.as().then(
		
		function () {
			
			var query = new Parse.Query(Parse.Role);
			query.equalTo('name', ROLE_ADMIN);
			query.equalTo('users', request.user);
			return query.first({useMasterKey: true});
		}
	
	).then(
		
		function (result) {
			
			admin = result;
			
			if (!(admin instanceof Parse.Role))
				return Parse.Promise.error(new Parse.Error(null, 'Not enough privileges to perform this operation'));
				
			return Push.sendPushNotification(request.params.message);
			
		}
	
	).then(
		
		function (result) {
			response.success();
		},
		function (error) {
			
			console.error(error);
			
			response.error(error.code === null ? error.message : 'During the operation error occurred');
			
		}
			
	);

});

//
// Adrian
//
Parse.Cloud.define('getProductById', function(request, response) {

	if (!_.has(request.params, 'Id') || _.isEmpty(request.params.Id))
		return response.error('Id is not specified');
	
	Parse.Promise.as().then( 
		function () {
			var query = new Parse.Query('Product');
			query.include(['brand','sizes','preview']);
			query.exists('sizes');
			return query.get(request.params.Id, request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {})
			.then(
				null,
				function() {
					return Parse.Promise.error(new ArmariumError(ArmariumError.PRODUCT_IS_NOT_AVAILABLE));
				}
			);
		}
	).then(
		function (result) {
			response.success(result);
		},
		function (error) {
			response.error(error instanceof ArmariumError ? error.toString() : error.message);
		}
	);

});

////////////////////////////////////////////////////////////////////////////////
// Jobs TODO


Parse.Cloud.job('userConfirm', function(request, status) {
	
	var
		now = moment.utc(),
		totalCount = confirmedCount = 0;
	
	var query = new Parse.Query('User');
	query.doesNotExist('confirmed');
	query.each(
		
		function (user) {
			
			totalCount++;
			
			var age = now.diff(moment.utc(user.createdAt), 'minutes');
			
			if (age >= _.random(USER_CONFIRM_AGE_MIN, USER_CONFIRM_AGE_MAX)) {
				
				confirmedCount++;
				
				user.set('confirmed', true);
				return user.save(null, {useMasterKey: true});
				
			} else
				return Parse.Promise.as();
				
		}
	
	).then(
		
		function () {
			status.success('Total - ' + totalCount + ', confirmed - ' + confirmedCount);
		},
		function (error) {
			status.error(error.message);
		}

	);
	
});


Parse.Cloud.job('orderRelease', function(request, status) {
	
	var
		now = moment.utc(),
		productCount = stylistCount = 0;
	
	var promises = [];
	
	var query = new Parse.Query('ProductOrder');
	
	query.lessThan('createdAt', moment.utc(now).subtract(PRODUCT_ORDER_LOCK_TIME).toDate());
	query.notContainedIn('state', [PRODUCT_ORDER_STATE_LOCKED, PRODUCT_ORDER_STATE_CHARGED, PRODUCT_ORDER_STATE_RETURNED, PRODUCT_ORDER_STATE_DELIVERED, PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED, PRODUCT_ORDER_STATE_REFUNDED]);
	
	promises.push(query.each(
		
		function (productOrder) {
			
			productCount++;
			
			return productOrder.destroy({useMasterKey: true});
			
		},
		{useMasterKey: true}
	
	));
	
	var query = new Parse.Query('StylistOrder');
	
	query.lessThan('createdAt', moment.utc(now).subtract(STYLIST_ORDER_LOCK_TIME).toDate());
	query.notContainedIn('state', [STYLIST_ORDER_STATE_LOCKED, STYLIST_ORDER_STATE_CHARGED, STYLIST_ORDER_STATE_REJECTED, STYLIST_ORDER_STATE_CANCELED, STYLIST_ORDER_STATE_APPROVED, STYLIST_ORDER_STATE_REFUNDED, STYLIST_ORDER_STATE_BOOKED]);
	
	promises.push(query.each(
		
		function (stylistOrder) {
			
			stylistCount++;
			
			return stylistOrder.destroy({useMasterKey: true});
			
		},
		{useMasterKey: true}
	
	));
	
	Parse.Promise.when(promises).then(
		
		function () {
			status.success('Product - ' + productCount + ', Stylist - ' + stylistCount);
		},
		function (errors) {
			
			var error = _.firstError(errors);
			
			status.error(error.message);
			
		}

	);
	
});


Parse.Cloud.job('productOrderReturnTomorrowNotification', function(request, status) {
	
	var
		now = moment.utc().startOf('day'),
		totalCount = sendedCount = notsendedCount = 0;
	
	var query = new Parse.Query('ProductOrder');
	query.exists('user');
	query.equalTo('dateTill', now.add({days: 1}).toDate());
	query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED]);
	query.notContainedIn('state', [PRODUCT_ORDER_STATE_RETURNED, PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED, PRODUCT_ORDER_STATE_REFUNDED]);
	query.each(
		
		function (productOrder) {
			
			totalCount++;
			
			return notificationSend(PUSH_NOTIFICATION_TYPE_PRODUCT_ORDER_RETURN_TOMORROW, productOrder.get('user'), null, productOrder.id).then(
				
				function (result) {
					
					if (result === true)
						sendedCount++;
					
					else
						notsendedCount++;
					
					return Parse.Promise.as();
						
				}
				
			);
			
		},
		{useMasterKey: true}
	
	).then(
		
		function () {
			status.success('Total - ' + totalCount + ', sended - ' + sendedCount + ', notsended - ' + notsendedCount);
		},
		function (error) {
			status.error(error.message);
		}

	);
	
});


Parse.Cloud.job('productOrderOverdueNotification', function(request, status) {
	
	var
		now = moment.utc().startOf('day'),
		totalCount = sendedCount = notsendedCount = 0;
	
	var query = new Parse.Query('ProductOrder');
	query.exists('user');
	query.lessThan('dateTill', now.toDate());
	query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED, PRODUCT_ORDER_STATE_DELIVERED]);
	query.notContainedIn('state', [PRODUCT_ORDER_STATE_RETURNED, PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED, PRODUCT_ORDER_STATE_REFUNDED]);
	
	query.each(
		
		function (productOrder) {
			
			totalCount++;
			
			return notificationSend(PUSH_NOTIFICATION_TYPE_PRODUCT_ORDER_OVERDUE, productOrder.get('user'), null, productOrder.id).then(
				
				function (result) {
					
					if (result === true)
						sendedCount++;
					
					else
						notsendedCount++;
					
					return Parse.Promise.as();
						
				}
				
			);
			
		},
		{useMasterKey: true}
	
	).then(
		
		function () {
			status.success('Total - ' + totalCount + ', sended - ' + sendedCount + ', notsended - ' + notsendedCount);
		},
		function (error) {
			status.error(error.message);
		}

	);
	
});


Parse.Cloud.job('updateProductPriceRange', function(request, status) {
	
	var
		totalCount = 0;
	
	var query = new Parse.Query('Product');
	query.each(
		
		function(product) {
			
			if (product.has('price'))
				product.set('price', product.get('price'));
			
			else
				product.unset('price');
			
			totalCount++;
			
			return product.save(null, {useMasterKey: true});
			
		}
	
	).then(
		
		function () {
			status.success('Total - ' + totalCount);
		},
		function (error) {
			status.error(error.message);
		}
		
	);

});


Parse.Cloud.job('updateProductCategories', function(request, status) {
	
	var
		totalCount = 0;
	
	var query = new Parse.Query('Product');
	query.each(
		
		function(product) {
			
			if (product.has('category1'))
				product.set('category1', product.get('category1'));
			
			else
				product.unset('category1');
			
			totalCount++;
			
			return product.save(null, {useMasterKey: true});
			
		}
	
	).then(
		
		function () {
			status.success('Total - ' + totalCount);
		},
		function (error) {
			status.error(error.message);
		}
		
	);

});


Parse.Cloud.job('userWishListMove', function(request, status) {
	
	var
		totalCount = 0;
	
	var query = new Parse.Query(Parse.User);
	query.each(
		
		function(user) {
			
			var relation = user.relation('wishList');
			
			return relation.query().find(request.user instanceof Parse.User ? {sessionToken: request.user.getSessionToken()} : {}).then(
				
				function (result) {
					
					if (_.isEmpty(result))
						return Parse.Promise.as();
					
					_.each(result, function (product) {
						user.addUnique('productWishList', product);
					});
					
					if (!user.has('phoneNumber'))
						user.set('phoneNumber', '');
					
					totalCount++;
					
					return user.save(null, {useMasterKey: true});
					
				}
				
			)
			
		}
		
	).then(
		
		function () {
			status.success('Total - ' + totalCount);
		},
		function (error) {
			status.error(error.message);
		}
		
	);
	
});


Parse.Cloud.job('userRemoveFirstBorrowGroup', function(request, status) {
	
	var
		totalCount = 0;
	
	var query = new Parse.Query(Parse.User);
	query.equalTo('group', 'First Borrow');
	query.each(
		
		function(user) {
			
			user.remove('group', 'First Borrow');
			totalCount++;
					
			return user.save(null, {useMasterKey: true});
			
		}
		
	).then(
		
		function () {
			status.success('Total - ' + totalCount);
		},
		function (error) {
			status.error(error.message);
		}
		
	);
	
});


Parse.Cloud.job('userGroupConvert', function(request, status) {
	
	var
		totalCount = 0;
		
	var translation = {
		1	: USER_GROUP_VIP,
		2	: USER_GROUP_FREE
	};
	
	var query = new Parse.Query('ProductOrder');
	query.equalTo('state', PRODUCT_ORDER_STATE_CHARGED);
	query.limit(PAGINATION_LIMIT);
	query.find({useMasterKey: true}).then(
		
		function (orders) {
			
			var users = _
				.chain(orders)
				.filter(function (order) {
					return order.has('user') && (user = order.get('user')) && (user instanceof Parse.User);
				})
				.map(function (order) {
					return order.get('user').id;
				})
				.value();
			
			var query = new Parse.Query(Parse.User);
			query.doesNotExist('converted');
			return query.each(
				
				function(user) {
					
					var groups = _
						.chain(user.get('group'))
						.filter(function (group) {
							return _.has(translation, group);
						})
						.map(function (group) {
							return translation[group];
						})
						.value();
					
					if (!_.contains(users, user.id))
						groups.push(USER_GROUP_FIRST_BORROW);
					
					if (!_.isEmpty(groups))
						user.set('group', groups);
					else if (user.has('group'))
						user.unset('group');
					
					user.set('converted', true);
					
					totalCount++;
					
					return user.save(null, {useMasterKey: true}).then(
						
						null,
						function (error) {
							console.log(error.message);
							return Parse.Promise.error(error);
						}
						
					);
						
				}
			
			);
		
		}
					
	).then(
		
		function () {
			status.success('Total - ' + totalCount);
		},
		function (error) {
			status.error(error.message);
		}
		
	);
	
});



////////////////////////////////////////////////////////////////////////////////
// Common functions

function productOrderNumberGenerate(date) {
	
	return 'p' + date.format('DDMMYY') + randomString('0123456789', 3);
	
}

function stylistOrderNumberGenerate(date) {
	
	return 's' + date.format('DDMMYY') + randomString('0123456789', 3);
	
}

function stylistOrderTimeBuild(stylistOrder) {
	
	var ranges = [];

	ranges.push(_.reduce(stylistOrder.get('orderTime'), function (memo, value) {
		
		if (!_.isNull(memo)) {
			
			if (value - memo.till === 1)
				memo.till = value;
				
			else {
				this.push(memo);
				memo = null;
			}
			
		}
		
		if (_.isNull(memo))
			memo = {from: value, till: value};
			
		return memo;
		
	}, null, ranges));
	
	return _.map(ranges, function (range) {return moment.utc(this).hours(range.from).format(TIME_FORMAT) + ' - ' + moment.utc(this).hours(range.till + 1).format(TIME_FORMAT);}, stylistOrder.get('orderDate'));
	
}

function randomString(possible, count) {
	
	var value = '';
	
	for (var i = 0; i < count; i++)
		value += possible.charAt(Math.floor(Math.random() * possible.length));
		
	return value;
	
}

// Send notification immediately
function notificationSend(pushNotificationType, target, context, payload) {
	
	// TODO RiP
	console.log('notificationSend with type ' + pushNotificationType);
	
	if (!_.has(PUSH_NOTIFICATION_TEMPLATE, pushNotificationType))
		return Parse.Promise.as(false);
		
	var template = _.template(PUSH_NOTIFICATION_TEMPLATE[pushNotificationType]);
	
	var pushQuery;
	
	if ((target instanceof Parse.User) || (target instanceof Parse.Object)) {

		var pushQuery = new Parse.Query(Parse.Installation);
		pushQuery.equalTo('user', target);
	
	} else if (target instanceof Parse.Query)
		pushQuery = target;
	
	else if (target instanceof Parse.Installation)
		pushQuery = target;
	
	else
		return Parse.Promise.as(false);
	
	var options = {
		where	: pushQuery,
		data	: {
			type	: pushNotificationType,
			alert	: template(context)
		}
	};
	
	if (payload)
		options.data.payload = payload;
	
	// TODO RiP
	console.log(options);
	
	return Parse.Push.send(options, {useMasterKey: true}).then(
		
		function (result) {
			return Parse.Promise.as(true);
		},
		function (error) {
			console.error('notificationSend failed with - ' + error.message);
			return Parse.Promise.as(false);
		}
		
	);
	
}

function checkUserRole(user, roleName) {
	
	if (!(user instanceof Parse.User))
		return Parse.Promise.error(new ArmariumError(ArmariumError.ACCESS_DENIED));
	
	if (_.isEmpty(roleName))
		return Parse.Promise.error(new ArmariumError(ArmariumError.ACCESS_DENIED));
		
	var query = new Parse.Query(Parse.Role);
	query.select(['name'])
	query.equalTo('name', roleName);
	query.equalTo('users', user);
	return query.first({useMasterKey: true}).then(

		function (result) {
			
			if (!(result instanceof Parse.Role))
				return Parse.Promise.error(new ArmariumError(ArmariumError.ACCESS_DENIED));
			
			return Parse.Promise.as();
				
		},
		function (error) {
			return Parse.Promise.error(new ArmariumError(ArmariumError.ACCESS_DENIED));
		}
		
	);
	
}


function processSystemEvent(type, user) {
	
	console.log('event type - ' + type)
	
	console.log('fetching events')
	
	var query = new Parse.Query('SystemEvent');
	
	query.equalTo('type', type);
	query.equalTo('published', true);
	
	return query.find({useMasterKey: true}).then(
		
		function (events) {
			
			console.log('processing events')
			console.log('event count - ' + _.size(events))
			
			var promises = [];
			
			_.each(events, function (se) {
				
				console.log(se.type);
				
				var
					params = se.get('params') || {};
				
				console.log(params);
				
				if (type === SYSTEM_EVENT_TYPE_USER_SIGNED) {
					
					if (_.has(params, 'userBalance')) {
						
						var transaction = new Parse.Object('Transaction');
						
						transaction.set('user', user);
						transaction.set('type', TRANSACTION_TYPE_GIFT_WHEN_USER_SIGNED);
						transaction.set('value', params.userBalance);
						
						promises.push(transaction.save(null, {useMasterKey: true}));
						
					}
					
					if (_.has(params, 'userGroupAdd')) {
						
						_.each(params.userGroupAdd, function (group) {
							this.addUnique('group', group);
						}, user);
						promises.push(user.save(null, {useMasterKey: true}));
						
					}
					
				} else if (type === SYSTEM_EVENT_TYPE_PRODUCT_ORDER_CHARGED) {
					
					if (
						_.has(params, 'userBalance') &&
						user.has('referrer') && (referrer = user.get('referrer')) && (referrer instanceof Parse.User) &&
						user.has('group') && _.contains(user.get('group'), USER_GROUP_FIRST_BORROW)
					) {
						
						var transaction = new Parse.Object('Transaction');
						
						transaction.set('user', user);
						transaction.set('type', TRANSACTION_TYPE_GIFT_WHEN_USER_CHARGED);
						transaction.set('value', params.userBalance);
						
						promises.push(transaction.save(null, {useMasterKey: true}));
						
					}
					
					if (
						_.has(params, 'userReferrerBalance') &&
						user.has('referrer') && (referrer = user.get('referrer')) && (referrer instanceof Parse.User) &&
						user.has('group') && _.contains(user.get('group'), USER_GROUP_FIRST_BORROW)
					) {
						
						var transactionParams = {
							referentId	: user.id
						};
						
						var transaction = new Parse.Object('Transaction');
						
						transaction.set('user', referrer);
						transaction.set('type', TRANSACTION_TYPE_GIFT_WHEN_REFERENT_CHARGED);
						transaction.set('value', params.userReferrerBalance);
						transaction.set('params', transactionParams);
						
						promises.push(transaction.save(null, {useMasterKey: true}));
						
					}
					
					if (_.has(params, 'userGroupAdd') || _.has(params, 'userGroupRemove')) {
						
						_.each(params.userGroupAdd, function (group) {
							this.addUnique('group', group);
						}, user);
						_.each(params.userGroupRemove, function (group) {
							this.remove('group', group);
						}, user);
						promises.push(user.save(null, {useMasterKey: true}));
						
					}
					
				}
				
			});
			
			return Parse.Promise.when(promises);
			
		}
		
	);
	
	console.log('event finished')
	
}


function calculateProductOrderDiscounts (productOrder, user, product, productDiscounts, previousProductOrders) {

	return Parse.Promise.as().then(

		function () {
			
			var
				discountCode = productOrder.get('discountCode');

			var
				prices = {
					productTotal		: product.get('price') || 0,
					productPrice		: product.get('price') || 0,
					productDiscount		: 0,
					deliveryTotal		: product.get('deliveryPrice') || 0,
					deliveryPrice		: product.get('deliveryPrice') || 0,
					deliveryDiscount	: 0,
					insuranceTotal		: product.get('insurancePrice') || 0,
					insurancePrice		: product.get('insurancePrice') || 0,
					insuranceDiscount	: 0
				};
			
			var
				appliedDiscounts = [];
				
			// Discount system
			
			_.each(['product', 'delivery', 'insurance', 'total'], function (discountType) {
				
				var
					appliedPriority;
				
				var
					typeDiscounts = _
					.chain(productDiscounts)
					.filter(
						
						function (discount) {
							
							return discount.has(discountType + 'Discount') && !_.isEmpty(discount.get(discountType + 'Discount')) && (!discount.has('code') || (discount.has('code') && !_.isEmpty(discountCode) && discount.get('code') === discountCode));
							
						}
						
					)
					.sortBy(
						
						function (discount) {
							
							return discount.has('priority') ? -discount.get('priority') : 0;
							
						}
						
					)
					.value();
				
				if (discountType === 'total') {
					
					prices[discountType + 'Total'] = prices[discountType + 'Price'] = prices['productPrice'] + prices['deliveryPrice'] + prices['insurancePrice'],
					prices[discountType + 'Discount'] = prices['productDiscount'] + prices['deliveryDiscount'] + prices['insuranceDiscount'];
					
				}
				
				_.each(typeDiscounts, function (discount) {
					
					var applied = _.isUndefined(appliedPriority) || (appliedPriority === (discount.get('priority') || 0));
					
					if (_.contains(discount.get('condition') || [], PRODUCT_DISCOUNT_CONDITION_USER_GROUP_IN_LIST)) {
						
						var
							userGroups = user.get('group') || [],
							discountGroups = _.map(discount.get('userGroup'), function (item) {return item.get('name');});
						
						applied = applied && _.size(discountGroups) > 0 && _.size(discountGroups) === _.size(_.intersection(userGroups, discountGroups));
						
					}
					
					if (_.contains(discount.get('condition') || [], PRODUCT_DISCOUNT_CONDITION_PRODUCT_IN_LIST)) {
						
						var
							discountProducts = _.map(discount.get('product'), function (item) {return item.id;});
						
						applied = applied && _.contains(discountProducts, product.id);
						
					}
					
					if (_.contains(discount.get('condition') || [], PRODUCT_DISCOUNT_CONDITION_FREE_SHIPPING)) {
						
						var linkedProductOrder = _.find(previousProductOrders, function (order) {
							
							return (
								productOrder.has('shippingAddress')
								&&
								(order.has('shippingAddress') && order.get('shippingAddress').id === productOrder.get('shippingAddress').id)
								&&
								(order.has('dateFrom') && order.get('dateFrom').getTime() === productOrder.get('dateFrom').getTime())
								&&
								(!_.contains(order.get('discounts') || [], PRODUCT_DISCOUNT_FREE_DELIVERY_TO_SAME_ADDRESS))
								&&
								(moment.utc().diff(moment.utc(order.createdAt), 'minutes') <= 60)
							);
								
						});
						
						applied = applied && (linkedProductOrder instanceof Parse.Object);
						
					}
					
					if (applied === true) {
						
						var
							value = discount.get(discountType + 'Discount') || {},
							discountValue;
						
						if (_.has(value, 'valueNumber') && _.isNumber(value.valueNumber) && value.valueNumber >= 0) {
							
							discountValue = value.valueNumber;
							
						} else if (_.has(value, 'valuePercent') && _.isNumber(value.valuePercent) && value.valuePercent >= 0) {
							
							discountValue = prices[discountType + 'Total'] * value.valuePercent / 100;
							
							if (_.has(value, 'valuePercentMin') && _.isNumber(value.valuePercentMin) && value.valuePercentMin >= 0 && discountValue < value.valuePercentMin)
								discountValue = value.valuePercentMin;
							
							if (_.has(value, 'valuePercentMax') && _.isNumber(value.valuePercentMax) && value.valuePercentMax >= 0 && discountValue > value.valuePercentMax)
								discountValue = value.valuePercentMax;
							
						} else
							applied = false;
						
						
						if (applied === true) {
							
							appliedPriority = discount.get('priority') || 0;
							
							prices[discountType + 'Price'] -= discountValue || 0;
							prices[discountType + 'Discount'] += discountValue || 0;
							
							if (!_.contains(_.map(appliedDiscounts, function (appliedDiscount) {return appliedDiscount.id;}), discount.id))
								appliedDiscounts.push(discount);
														
						}
						
					}
					
				});
				
				if (prices[discountType + 'Price'] < 0)
					prices[discountType + 'Price'] = 0;
				
			});
			
			_.each(
				[
					'productPrice', 'productDiscount', 'productTotal',
					'deliveryPrice', 'deliveryDiscount', 'deliveryTotal',
					'insurancePrice', 'insuranceDiscount', 'insuranceTotal',
					'totalPrice', 'totalDiscount'
				],
				function (priceName) {
					
					if (_.has(this, priceName))
						productOrder.set(priceName, this[priceName]);
					
				},
				prices
			);
			
			productOrder.set('totalAmount', prices.totalPrice);
			
			if (!_.isEmpty(appliedDiscounts)) {
				
				// Fill old type discounts
				
				var items = _
					.chain(appliedDiscounts)
					.filter(
						function (appliedDiscount) {
							return appliedDiscount.has('oldType') && appliedDiscount.get('oldType');
						}
					)
					.map(
						function (appliedDiscount) {
							return appliedDiscount.get('oldType');
						}
					)
					.unique()
					.value();
				
				if (!_.isEmpty(items))
					productOrder.set('discounts', items);
				
				else if (productOrder.has('discounts'))
					productOrder.unset('discounts');
				
				// Fill new type discounts
				
				productOrder.set('productDiscounts', appliedDiscounts);
				
				// Fill old type discount descriptions
				
				var items = _
					.chain(appliedDiscounts)
					.filter(
						function (appliedDiscount) {
							return appliedDiscount.has('note') && appliedDiscount.get('note');
						}
					)
					.map(
						function (appliedDiscount) {
							return appliedDiscount.get('note');
						}
					)
					.unique()
					.value();
				
				if (!_.isEmpty(items))
					productOrder.set('discountDescription', items.join('\n'));
				
				else if (productOrder.has('discountDescription'))
					productOrder.unset('discountDescription');
				
			} else {
				
				if (productOrder.has('discounts'))
					productOrder.unset('discounts');
				
				if (productOrder.has('productDiscounts'))
					productOrder.unset('productDiscounts');
				
				if (productOrder.has('discountDescription'))
					productOrder.unset('discountDescription');
				
			}
			
			return Parse.Promise.as(productOrder);
			
		}
	
	);

}

function calculateProductOrderTax (productOrder, user, shippingAddress) {
	
	if (!(shippingAddress instanceof Parse.Object))
		return Parse.Promise.as({order: productOrder, response: null});
	
	var
		product = productOrder.get('product');
	
	var
		lookupService = TaxCloud.lookupRequest(),
		lookupResponse;
	
	return Parse.Promise.as().then(
		
		function () {
			
			var
				taxableAmount = productOrder.get('productPrice') || 0;
			
			var
				origin = new AddressEntity(PRODUCT_ORDER_DEFAULT_ORIGIN),
				destination = new AddressEntity(shippingAddress.get('value'));
			
			lookupService
				.setCustomerId(user.id)
				.setCartId(productOrder.id)
				.setDeliveredBySeller(false)
				.setOrigin(origin)
				.setDestination(destination)
				.addCartItem(product.id, taxableAmount, 1, PRODUCT_ORDER_DEFAULT_TIC);
				
			return lookupService.query().then(
				
				null,
				function (error) {
					return Parse.Promise.as(error)
				}
				
			);

			
		}
	
	).then(
		
		function (result) {
			
			lookupResponse = result;
			
			if (lookupService._request)
				productOrder.set('taxcloudLookupRequest', JSON.stringify(lookupService._request));
			
			if (lookupService._response)
				productOrder.set('taxcloudLookupResponse', JSON.stringify(lookupService._response));
			
			if (!(lookupResponse instanceof ArmariumError)) {
				
				productOrder.set('taxPrice', lookupResponse || 0);
				
				productOrder.addUnique('state', PRODUCT_ORDER_STATE_TAXCLOUD_LOOKUPED);
				
			} else {
				
				productOrder.unset('taxPrice');
				
				productOrder.remove('state', PRODUCT_ORDER_STATE_TAXCLOUD_LOOKUPED);
				
			}
			
			return Parse.Promise.as({order: productOrder, response: lookupResponse});
			
		}
	
	);
	
}

function calculateProductOrderTotal (productOrder, user) {
	
	return Parse.Promise.as().then(
		
		function () {
			
			var
				taxPrice = productOrder.get('taxPrice') || 0,
				totalPrice = productOrder.get('totalAmount') || 0,
				userBalance = user.get('balance') || 0;
			
			totalPrice += taxPrice;
			
			var
				totalBalance = _.min([userBalance, totalPrice]);
			
			if (totalBalance > 0)
				totalPrice -= totalBalance;
				
			productOrder.set('totalPrice'	, totalPrice);
			productOrder.set('totalBalance'	, totalBalance);
			productOrder.set('userBalanceRemaining'	, userBalance - totalBalance);
			
			return Parse.Promise.as(productOrder);
			
		}
	
	);
	
}