define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('Content', {
		
		_types: {
			node					: Number,
			key						: String,
			index					: Number,
			description				: String,
			type					: String,
			textValue				: String,
			fileValue				: Parse.File,
			searchable				: Array,
			indexedAt				: Date
		},
		
		_formats: {
			
			_node : function (model) {
				
				var node = _.chain(model.nodeEnum).where({id: model.get('node') || 0}).first().value();
				
				return node ? node.text : null;
				
			}
			
		},
		
		nodeEnum: [
			{id: 1		, text: 'App'},
			{id: 2		, text: 'Website'}
		],
		
		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		}
		
	});
	
	return model;

});