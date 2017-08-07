define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('CustomerProfile', {
		
		_types: {
			parent					: Parse.Object,
			key						: String,
			title					: String,
			type					: String,
			multiple				: Boolean,
			note					: String,
			hint					: String,
			placeholder				: String,
			values					: Array,
			isCategory				: Boolean,
			searchable				: Array,
			indexedAt				: Date,
			sortOrder				: Number,
			published				: Boolean
		},
		
		_formats: {
			
			_values0 : function (model) {
				
				var result = _
					.chain(model.get('type') === 'DoublePicker' ? (model.get('values') || [])[0] : model.get('values'))
					.map(function (value) {return _.has(value, 'value') ? value.value : null;})
					.compact()
					.value();
				
				return result;
				
			},
			
			_values1 : function (model) {
				
				var result = _
					.chain(model.get('type') === 'DoublePicker' ? (model.get('values') || [])[1] : [])
					.map(function (value) {return _.has(value, 'value') ? value.value : null;})
					.compact()
					.value();
				
				return result;
				
			}
			
		},
		
		typeEnum : [
			{id: 'DoublePicker', text: 'DoublePicker'}
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
			
		}
		
	});
	
	return model;

});