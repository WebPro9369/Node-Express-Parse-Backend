define([
	'underscore',
	'parse'
], function (
	_, Parse
) {


	function ManagerListControl (collection, storage, options) {
    	
    	//_.bindAll(this, 'make', 'run', 'process', 'processRaw');
    	
    	this._filter = {};
    	this._control = {};
    	this._query = null;
    	
    	/*if (!collection.query)
    		throw 'collection query is not defined';*/
    	
    	this.collection = collection;
    	this.storage = storage;
    	this.options = options || {};
    	
    	//this.collection.bind('all', function () {console.log(arguments);});
    	
    }
    
    
    ManagerListControl.prototype.filter = function (name, prototype, opts) {
    	
    	if (prototype) {
    		
			var params = opts || {};
			
			params.collection = this.collection;
			params.name = name;
			
			if (this.storage)
				params.storage = this.storage;
			
			this._filter[name] = new prototype(params);
			
			return this;
		
		} else
			return this._filter[name];
		
	};
	
	
	ManagerListControl.prototype.search = function (name, prototype, opts) {
    	
    	if (prototype) {
    		
			var params = opts || {};
			
			params.collection = this.collection;
			params.name = name;
			
			if (this.storage)
				params.storage = this.storage;
			
			this._control.search = new prototype(params);
			
			return this;
		
		} else
			return this._control.search;
		
	};
	
	
	ManagerListControl.prototype.sorting = function (name, prototype, opts) {
    	
    	if (prototype) {
    		
			var params = opts || {};
			
			params.collection = this.collection;
			params.name = name;
			
			if (this.storage)
				params.storage = this.storage;
			
			this._control.sorting = new prototype(params);
			
			return this;
		
		} else
			return this._control.sorting;
		
	};
	
	
	ManagerListControl.prototype.pagination = function (name, prototype, opts) {
    	
    	if (prototype) {
    		
			var params = opts || {};
			
			params.collection = this.collection;
			params.name = name;
			
			if (this.storage)
				params.storage = this.storage;
			
			this._control.pagination = new prototype(params);
			
			this._control.pagination.listen();
			
			return this;
		
		} else
			return this._control.pagination;
		
	};
	
	
	ManagerListControl.prototype.theme = function (name, prototype, opts) {
    	
    	if (prototype) {
    		
			var params = opts || {};
			
			params.collection = this.collection;
			params.name = name;
			
			if (this.storage)
				params.storage = this.storage;
			
			this._control.theme = new prototype(params);
			
			return this;
		
		} else
			return this._control.theme;
		
	};
	
	
	ManagerListControl.prototype.listener = function (value) {
		
		if (value) {
		
			this.collection.bind('filter:* sorting:* search pagination', value);
	    	
		}
		
		return this;
		
	};
	
	
	ManagerListControl.prototype.render = function (view, filterRenderer, controlRenderer) {
		
		_.each(this._filter, function (filter, name) {
			
			if (_.isFunction(filterRenderer))
				filterRenderer(view, filter, name);
				
			else
				filter.setElement(view.$('[role="filter"] [name="' + name + '"]'));
				
		});
		
		_.each(this._control, function (control, name) {
			
			if (_.isFunction(controlRenderer))
				controlRenderer(view, control, name);
				
			else
				control.setElement(view.$('[role="' + name + '"]')).render();
			
		});
		
		return this;
		
	};
	
	
	ManagerListControl.prototype.invalidate = function () {
		
		_.each(this._filter, function (filter, name) {
			filter.invalidate();
		});
		
		_.each(this._control, function (control, name) {
			control.invalidate();
		}, this);
		
		return this;
		
	};
	
	
	ManagerListControl.prototype.fetch = function () {
		
		var ready = true;
		
		_.each(this._filter, function (filter, name) {
			ready = ready && filter.ready();
		});
		
		_.each(this._control, function (control, name) {
			ready = ready && control.ready();
		});
		
		if (!ready)
			return Parse.Promise.as();
		
		if (_.isFunction(this.options.onBeforeFetch))
			return this.options.onBeforeFetch();
		
		var source = JSON.stringify(this.collection.query.toJSON());
		
		if (_.isNull(this._query) && _.has(this._control, 'pagination'))
			this._control.pagination.listen(true);
		
		if (this._query === source)
			return Parse.Promise.as();
		
		this._query = source;
		
		return this.collection.fetch();
		
	};
	

	return ManagerListControl;
	
});