define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('Stylist', {
		
		_types: {
			fullName				: String,
			details					: String,
			city					: String,
			zip						: String,
			location				: Parse.GeoPoint,
			radiusToServe			: Number,
			ableToTravel			: Boolean,
			price					: Number,
			type					: Number,
			photo					: Parse.Object,
			image					: Parse.Object,
			showroom				: Parse.Object,
			gender					: Number,
			previousJob				: Array,
			socialLink				: Array,
			shareLink				: String,
			primary					: Boolean,
			searchable				: Array,
			indexedAt				: Date,
			sortOrder				: Number,
			notificatedAt			: Date,
			hidden					: Boolean,
			published				: Boolean
		},
		
		_formats: {
			
			_type : function (model) {
				
				var type = _.chain(model.typeEnum).where({id: model.get('type') || 0}).first().value();
				
				return type ? type.text : null;
				
			},
			
			_gender : function (model) {
				
				var type = _.chain(model.genderEnum).where({id: model.get('gender') || 0}).first().value();
				
				return type ? type.text : null;
				
			}
			
		},
		
		typeEnum: [
			{id: STYLIST_TYPE_STAR		, text: 'Star stylist'},
			{id: STYLIST_TYPE_INHOME	, text: 'Inhome stylist'}
		],

		genderEnum: [
			{id: STYLIST_GENDER_HE		, text: 'He'},
			{id: STYLIST_GENDER_SHE		, text: 'She'},
			{id: STYLIST_GENDER_THEY	, text: 'They'},
		],
		
		socialTypeEnum: [
			{id: 'pinterest'			, text: 'Pinterest'},
			{id: 'google-plus'			, text: 'Google+'},
			{id: 'tumblr'				, text: 'Tumblr'},
			{id: 'youtube'				, text: 'YouTube'},
			{id: 'facebook'				, text: 'Facebook'},
			{id: 'twitter'				, text: 'Twitter'},
			{id: 'instagram'			, text: 'Instagram'},
			{id: 'vimeo'				, text: 'Vimeo'},
			{id: 'flickr'				, text: 'Flickr'},
			{id: 'skype'				, text: 'Skype'},
			{id: 'whatsapp'				, text: 'WhatsApp'}
		],
		
		order : undefined,
		
		
		initialize: function () {
			
			this.order = undefined;
			
		},
		
		
		doOrderChange: function (value) {
			
			if (_.isUndefined(this.order))
				this.order = this.get('sortOrder');
			
			var changed = this.order !== value;
			 
			this.order = value;
			
			if (changed)
				this.trigger('change');
			
		},
		
		
		doOrderApply: function (value) {
			
			if (this.order !== this.get('sortOrder'))
				this.set('sortOrder', this.order);
			
		},
		
		
		isOrderChanged: function () {
			
			return this.get('sortOrder') !== this.order;
			
		},
		
		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		}
		
	});
	
	return model;

});