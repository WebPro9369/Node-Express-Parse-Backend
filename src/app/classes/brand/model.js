define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('Brand', {
		
		_types: {
			name					: String,
			brandDescription		: String,
			image					: Parse.Object,
			cover					: Parse.Object,
			inSlider				: Boolean,
			primary					: Boolean,
			searchable				: Array,
			indexedAt				: Date,
			sortOrder				: Number,
			hidden					: Boolean,
			published				: Boolean
		},
		
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
			
		}
		
	});
	
	return model;

});