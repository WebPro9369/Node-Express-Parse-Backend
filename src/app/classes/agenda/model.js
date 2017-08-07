define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('Agenda', {
		
		_types: {
			
			theme					: Number,
			
			// Thumbnail
			thumbTitle				: String,
			thumbSubtitle			: String,
			thumbImage				: Parse.Object,
			
			// List
			listTitle				: String,
			listSubtitle			: String,
			listImage				: Parse.Object,
			
			// List
			coverTitle				: String,
			coverSubtitle			: String,
			coverImage				: Parse.Object,
			
			// Header
			boxTitle				: String,
			boxSubtitle				: String,
			bannerImage				: Array,
			
			// Content
			title					: String,
			subtitle				: String,
			text					: String,
			gridImage				: Array,
			gridBottomImage			: Array,
			
			// Footer
			browseTitle				: String,
			browseSubtitle			: String,
			browseUrl				: String,
			browseImage				: Array,
			
			// Misc.
			searchable				: Array,
			indexedAt				: Date,
			carouselOrder			: Number,
			carouselUrl				: String,
			sortOrder				: Number,
			inSlider				: Boolean,
			primary					: Boolean,
			hidden					: Boolean,
			published				: Boolean
			
		},
		
		_formats: {
			
			_theme : function (model) {
				
				var theme = _.findWhere(model.themeEnum, {id: model.get('theme')});
				return theme ? theme.text : null;
				
			}
		
		},
		
		themeEnum: [
			{id: 1, text: 'Save Venice'},
			{id: 2, text: 'Night Moves'},
			{id: 3, text: 'Favorite Look'},
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