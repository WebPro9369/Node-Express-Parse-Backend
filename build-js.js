({
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
		'excel-builder'					: '//assets/plugins/excel-builder/excel-builder.dist'
		
	},
	baseUrl	: './src/',
	name	: 'main',
	out		: './public/main.js',
	optimize: 'uglify',
	preserveLicenseComments: false
})