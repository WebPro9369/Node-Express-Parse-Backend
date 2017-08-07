define([
    'underscore',
    'parse'
], function(_, Parse) {
	
	Parse.Router.prototype._routeToRegExp = function(route) {
	
		var
			namedParam    = /:\w+/g,
			splatParam    = /\*\w+/g,
			escapeRegExp  = /[\-\[\]{}()+?.,\\\^\$\|#\s]/g;
		
		route = route.replace(escapeRegExp, '\\$&').replace(namedParam, '([^\/\!]+)').replace(splatParam, '([^\!]*?)');
					
		return new RegExp('^' + route + '(?:\!.*)?$');
	
	};
	
	Parse.Router.prototype._generate = function (name, params, filters) {
			
		for (var value in this.routes) {
			
			var key = this.routes[value];
			
			if (key == name) {
				
				var parameters = value.match(/:\w+/g);
				parameters = _.map(parameters, function (value) {return value.slice(1);});
				
				if (_.isEmpty(_.difference(parameters, !_.isEmpty(params) && _.isObject(params) ? _.keys(params) : []))) {
					
					return '#' + 
						value.replace(/:(\w+)/g, _.bind(function (match, p1, offset, str) {return this[p1] ? this[p1] : '';}, params)) +
						(
							!_.isEmpty(filters) && _.isObject(filters) ? 
								'!' + _.map(filters, function (value, key) {return key + '=' + encodeURI(value);}).join(',') :
								''
						);
					
				}
				
			}
			
		}
		
		console.error('No matched route for generate');
		console.error(name, params, filters);
		
		return '#';
		
	};
	
	Parse.Query.prototype._removeConstraint = function(key, constraint) {
		
		var constraints = {
			'notEqualTo'				: ['$ne'],
			'lessThan'					: ['$lt'],
			'greaterThan'				: ['$gt'],
			'lessThanOrEqualTo'			: ['$lte'],
			'greaterThanOrEqualTo'		: ['$gte'],
			'containedIn'				: ['$in'],
			'notContainedIn'			: ['$nin'],
			'containsAll'				: ['$all'],
			'exists'					: ['$exists'],
			'doesNotExist'				: ['$exists'],
			'matches'					: ['$regex', '$options'],
			'matchesQuery'				: ['$inQuery'],
			'doesNotMatchQuery'			: ['$notInQuery'],
			'matchesKeyInQuery'			: ['$select'],
			'doesNotMatchKeyInQuery'	: ['$dontSelect'],
			'contains'					: ['$regex'],
			'startsWith'				: ['$regex'],
			'endsWith'					: ['$regex'],
			'near'						: ['$nearSphere'],
			'withinRadians'				: ['$maxDistance'],
			'withinMiles'				: ['$maxDistance'],
			'withinKilometers'			: ['$maxDistance'],
			'withinGeoBox'				: ['$within']
		};
		
		if (_.has(this._where, key) && _.has(constraints, constraint) && _.isObject(this._where[key])) {
			
			var condition = constraints[constraint];
			
			if (conditions = _.intersection(_.keys(this._where[key]), condition)) {
				
				_.each(conditions, function (condition) {
					delete(this[condition]);
				}, this._where[key]);
				
			}
			
			if (_.isEmpty(this._where[key]))
				delete(this._where[key]);
			
		} else if (_.has(this._where, key) && constraint == 'equalTo') {
			delete(this._where[key]);
		}

		return this;
		
	};
	
	Parse.Object.prototype.toObject = function () {
		
		var data = _.mapObject(this.attributes, function (value, key) {
			
			if (value && (value instanceof Parse.Object)) {
				return value.toObject();
			} else if (value && (value instanceof Parse.File))
				return {name: value.name(), url: value.url()};
			else
				return value;
			
		}, this);
		
		if (_.has(this, 'id'))
			data.id = data.objectId = this.id;
		
		if (_.has(this, 'createdAt'))
			data.createdAt = this.createdAt;
		
		if (_.has(this, 'updatedAt'))
			data.updatedAt = this.updatedAt;
		
		data.acl = this.getACL();
		
		return _.extend(this._defaults ? _.clone(this._defaults) : {}, data);
		
	};
	
	Parse.Object.prototype.toTemplate = function () {
		
		var data = _.mapObject(this.attributes, function (value, key) {
			
			//console.log(key + ' = ' + (this._types && this._types[key] ? this._types[key].name : '' ))
			
			if (value && (value instanceof Parse.Object))
				return value.toTemplate();
				
			else if (value && (value instanceof Parse.File))
				return {name: value.name(), url: value.url()};
			
			else if (value && (value instanceof Array))
				return _.map(value, function (item) {
					return _.isFunction(item.toTemplate) ? item.toTemplate() : item;
				});
			
			else if (value && (value instanceof Object))
				return _.has(this._types, key) ? new this._types[key](value) : value;
			
			else
				return value;
			
		}, this);
		
		var defaults = _.mapObject(this._types, function (type, key) {
			
			if (type.name === 'String')
				return '';
				
			else if (type.name === 'Number')
				return null;
				
			else if (type.name === 'Boolean')
				return null;
				
			else if (type.name === 'Date')
				return null;
				
			else if (type.name === 'Array')
				return [];
				
			else if (type.name === 'Object')
				return {};
			
			else if (_.isFunction(type.prototype.decode))
				return new type();
			
			else
				return null;
			
		});
		
		var formats = _.mapObject(this._formats, function (encoder, key) {
			
			return _.isFunction(encoder) ? encoder(this) : null;
			
		}, this);
		
		if (_.has(this, 'id'))
			data.id = data.objectId = this.id;
		
		if (_.has(this, 'createdAt'))
			data.createdAt = this.createdAt;
		
		if (_.has(this, 'updatedAt'))
			data.updatedAt = this.updatedAt;
		
		data.acl = this.getACL();
		
		return _.extend(defaults, data, formats);
		
	};
	
});