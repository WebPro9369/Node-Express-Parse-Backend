define([
	'underscore',
	'parse'
], function (
	_, Parse
) {


	function LocationManager (router) {
    	
    	//_.bindAll(this, 'make', 'run', 'process', 'processRaw');
    	
    	this.router = router;
    	
    }
    
    
    LocationManager.prototype._parse = function (args) {
			
		var params = {};
		
		var chains = String(args).split(',');
		
		for (var i in chains) {
			
			var chain = chains[i];
			
			if (param = chain.match(/^(\w+)=(\S*)$/)) {
				params[param[1]] = param[2];
			}
			
		}
		
		return params;
		
	};
	
	
	LocationManager.prototype._args = function () {
			
		var fragment = Parse.history.getFragment();
		
		return (query = fragment.match(/^([^\!]+)(?:\!(.*))?$/)) ? this._parse(query[2]) : {};
		
	};
		
		
	LocationManager.prototype._update = function (replace, remove) {
			
		var fragment = Parse.history.getFragment();
		
		/*console.log(replace);
		console.log(remove);
		console.log(fragment);*/
		
		var params = (query = fragment.match(/^([^\!]+)(?:\!(.*))?$/)) ? this._parse(query[2]) : {};
		
		/*console.log(query);
		console.log(params);*/
		
		var removed = (!_.isEmpty(remove) && (_.isString(remove) || _.isArray(remove))) ? _.omit(params, remove) : params;
		
		//console.log(removed);
		
		var replaced = (_.isObject(replace) && !_.isEmpty(replace)) ? _.defaults(replace, removed) : removed;

		//console.log(replaced);
		
		var joined = _.map(replaced, function (value, key) {return key + '=' + value;}).join(',');
		
		//console.log(joined);
		
		this.router.navigate(query[1] + (!_.isEmpty(joined) ? '!' + joined : ''), {trigger: false, replace: true});
		
	};
    
    LocationManager.prototype.has = function (name) {
    	
    	var args = this._args();
    	
		return _.has(args, name);
		
	}
	
	
	LocationManager.prototype.get = function (name, value) {
		
		var args = this._args();
		
		return _.has(args, name) ? decodeURI(args[name]) : value;
		
	}
	
	
	LocationManager.prototype.set = function (name, value) {
		
		if (value) {
			
			var params = {};
			params[name] = encodeURI(value);
			
			this._update(params, null);
		
		} else
			this._update(null, [name]);
		
		return this;
		
	}
	
	
	LocationManager.prototype.unset = function (name) {
		
		this._update(null, [name]);
		
		return this;
		
	}
	

	return LocationManager;
	
});