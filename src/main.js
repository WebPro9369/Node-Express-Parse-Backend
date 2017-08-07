require.config({
	shim : {
		jquery		: {
			exports	: '$'
		},
		underscore	: {
			exports : '_'
		},
		lodash	: {
			exports : 'lodash'
		},
		'underscore-wrapper'	: {
			deps	: ['underscore', 'lodash'],
			exports : '_'
		},
		numeral		: {
			exports	: 'numeral'
		},
		moment		: {
			exports	: 'moment'
		},
		bootstrap	: {
			deps	: ['jquery']
		},
		parse		: {
			deps	: ['jquery', 'underscore-wrapper'],
			exports	: 'Parse'
		},
		'mCustomScrollbar': {
			deps	: ['jquery']
		}, 
		'jquery-validation': {
			deps	: ['jquery'],
			exports	: '$.validator'
		},
		'jquery-validation.defaults': {
			deps	: ['jquery-validation']
		},
		'cke-editor': {
			deps	: ['jquery']
		},
		'cke-editor.adapters': {
			deps	: ['cke-editor']
		},
		jszip		: {
			exports	: 'JSZip'
		},
		'jszip-wrapper': {
			deps	: ['jszip'],
		},
		'excel-builder'		: {
			deps	: ['underscore-wrapper', 'jszip-wrapper'],
			exports	: 'ExcelBuilder'
		}
	},
	paths : {
		
		// App
		router							: 'app/router',
		classes							: 'app/classes',
		entities						: 'app/entities',
		views							: 'app/views',
		controls						: 'app/controls',
		templates						: 'app/templates',
		
		// Libs
		underscore						: 'libs/underscore/underscore',
		lodash							: 'libs/lodash/lodash.min',
		numeral							: 'libs/numeral/numeral',
		moment							: 'libs/moment/moment',
		parse							: 'libs/parse/parse-1.5.0',
		
		'underscore-wrapper'			: 'libs/underscore/underscore-wrapper',
		'underscore+'					: 'libs/underscore/extension',
		'parse+'						: 'libs/parse/extension',
		
		'jszip'							: 'libs/jszip/jszip.min',
		'jszip-wrapper'					: 'libs/jszip/jszip-wrapper',
		
		// Theme
		'jquery'						: 'assets/plugins/jquery/jquery-1.11.1.min',
		'bootstrap'						: 'assets/plugins/bootstrap/js/bootstrap',
		'layout'						: 'assets/theme/layout',
		'noty'							: 'assets/plugins/noty/jquery.noty.packaged',
		'jquery-validation'				: 'assets/plugins/jquery-validation/jquery.validate',
		'jquery-validation.defaults'	: 'assets/plugins/jquery-validation/defaults',
		'select2'						: 'assets/plugins/select2/select2',
		'autosize'						: 'assets/plugins/autosize/autosize.min',
		'jquery.magnific-popup'			: 'assets/plugins/magnific/jquery.magnific-popup',
		'filedrop-iterate'				: 'assets/plugins/filedrop-iterate/jquery.filedrop-iterate',
		'jquery-ui'						: 'assets/plugins/jquery-ui/jquery-ui-1.10.4.min',
		'jquery.nestable'				: 'assets/plugins/jquery-ui/jquery.nestable',
		'bootstrap-datepicker'			: 'assets/plugins/bootstrap-datepicker/js/bootstrap-datepicker',
		'bootstrap-editable'			: 'assets/plugins/bootstrap-editable/js/bootstrap-editable',
		'jquery.bootstrap-touchspin'	: 'assets/plugins/touchspin/jquery.bootstrap-touchspin',
		'icheck'						: 'assets/plugins/icheck/icheck',
		'jquery.cookies'				: 'assets/plugins/jquery-cookies/jquery.cookies',
		'mCustomScrollbar'				: 'assets/plugins/mcustom-scrollbar/jquery.mCustomScrollbar.concat.min',
		'magnific-popup'				: 'assets/plugins/magnific-popup/jquery.magnific-popup',
		'jquery.sortable'				: 'assets/plugins/sortable/jquery.sortable',
		'cke-editor'					: 'assets/plugins/cke-editor/ckeditor',
		'cke-editor.adapters'			: 'assets/plugins/cke-editor/adapters/jquery',
		'svg'							: 'assets/plugins/svg/svg.min',
		'jstree'						: 'assets/plugins/jstree/jstree.min',
		'excel-builder'					: 'assets/plugins/excel-builder/excel-builder.dist'
		
	}
});

const ROLE_ADMIN		= 'admin';
const ROLES				= [ROLE_ADMIN];

const DATETIME_FORMAT	= 'MMM D, YYYY h:mm A';
const DATE_FORMAT		= 'MMM D, YYYY';
const DATE_FORMAT_MONTH	= 'MMM D';
const DATE_FORMAT_DAY	= 'D';
const TIME_FORMAT		= 'h:mm A';
const MONEY_FORMAT		= '$0,0.00';
const NUMBER_FORMAT		= '0,0';

const
	SYSTEM_EVENT_TYPE_USER_SIGNED				= 1,
	SYSTEM_EVENT_TYPE_PRODUCT_ORDER_CHARGED		= 2;

const
	USER_GROUP_VIP			= 1,
	USER_GROUP_FREE			= 2;

const
	PRODUCT_RENT_LENGTH_MIN			= 4;

const
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
	PRODUCT_ORDER_STATE_TAXCLOUD_RETURNED = 11;

const
	PRODUCT_DISCOUNT_DEVELOPMENT						= -1,
	PRODUCT_DISCOUNT_FREE_DELIVERY_TO_SAME_ADDRESS		= 1,
	PRODUCT_DISCOUNT_20_OFF_FIRST_BORROW				= 2,
	PRODUCT_DISCOUNT_30_OFF_EVERY_BORROW_FOR_VIP		= 3;

const
	PRODUCT_DISCOUNT_CONDITION_USER_GROUP_IN_LIST		= 1,
	PRODUCT_DISCOUNT_CONDITION_PRODUCT_IN_LIST			= 2,
	PRODUCT_DISCOUNT_CONDITION_FREE_SHIPPING			= 100;

const
	STYLIST_ORDER_STATE_LOCKED		= 1,
	STYLIST_ORDER_STATE_CONFIRMED	= 2,
	STYLIST_ORDER_STATE_CHARGED		= 3,
	STYLIST_ORDER_STATE_REJECTED	= 4,
	STYLIST_ORDER_STATE_CANCELED	= 5,
	STYLIST_ORDER_STATE_APPROVED	= 6,
	STYLIST_ORDER_STATE_REFUNDED	= 7;
	STYLIST_ORDER_STATE_BOOKED		= 8;

const
	STYLIST_TYPE_STAR				= 1,
	STYLIST_TYPE_INHOME				= 2;

const
	STYLIST_GENDER_HE				= 1,
	STYLIST_GENDER_SHE				= 2,
	STYLIST_GENDER_THEY				= 3;

const PAGINATION_DEFAULT_SIZE = 20;
const PAGINATION_LIMIT = 2000;

var DEBUG_LEVEL = {
	NONE	: 0,
	ERROR	: 1,
	WARNING	: 2,
	NOTICE	: 3,
	TRACE	: 4
};

var app = {
	
	DEBUG_LEVEL		: DEBUG_LEVEL.TRACE,
	
	settings		: null,
	
	user			: {},
	
	router			: null,
	
	locationManager	: null

};

require(
	['underscore-wrapper', 'parse', 'router', 'views/app', 'controls/location-manager', 'parse+', 'jszip-wrapper'],
	function(_, Parse, AppRouter, AppView, LocationManager) {
	
		Parse.initialize('armarium', 'vziki3qBN3LDmKhpzTVT');
		Parse.serverURL = '/parse';
		//Parse.serverURL = 'https://armarium.herokuapp.com/parse';
		
		app.router = new AppRouter();
		
		app.locationManager = new LocationManager(app.router);
		
		Parse.history.start();

	}
);
