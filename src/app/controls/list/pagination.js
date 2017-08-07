/*
PaginationControl

collection	: Parse.Collection (required)	- Paginated collection
name		: String			 			- Storage key
value		: Number						- Initial value
size		: Number						- Page size (if not specified, then value will be taken from global PAGINATION_DEFAULT_SIZE constant)
disabled	: Boolean						- Disable control
storage		: StorageManager				- StorageManager instance to hold values

*/

define([
    'jquery',
    'underscore',
    'parse',
    
    'text!./pagination/template.html'
], function(
	$, _, Parse,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {
			'click [data-page]'		: 'doChangePage'
		},
		
		_value : null,
		_count : null,
		_size : null,
		_disabled : null,
		_ready : null,
		
		_query: null,
		
		_activated : null,
	
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.initialize');
	
			_.bindAll(this, 'render', 'value', 'reset', 'disable', 'enable', 'invalidate', 'ready', 'listen', 'apply', 'setCount', 'recount', 'doChangePage');
			
			this.template = _.template(viewTemplate);
			
			this._ready = false;
			this._activated = false;
			
			if (_.has(options, 'name') && _.isString(options.name) && !_.isEmpty(options.name))
				this.name = options.name;
			
			
			if (_.has(options, 'storage'))
				this.storage = options.storage;
			
			
			if (this.name && this.storage && this.storage.has(this.name))
				this._value = this.storage.get(this.name, 1) - 1;
				
			else if (_.has(options, 'value') && _.isNumber(options.value) && options.value > 0)
				this._value = options.value;
				
			else
				this._value = 0;
			
			
			if (_.has(options, 'size') && _.isNumber(options.size) && options.size > 0)
				this._size = options.size;
				
			else if (_.isNumber(PAGINATION_DEFAULT_SIZE) && PAGINATION_DEFAULT_SIZE > 0)
				this._size = PAGINATION_DEFAULT_SIZE;
			
			else
				this._size = 10;
			
			this._disabled = options.disabled === true;
				
			this.collection.bind('reset', this.recount);
	
		},
	
	
		render : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.render');
			
			var data = {
				value	: this._value,
				count	: this._count,
				size	: this._size,
				disabled: this._disabled,
				first	: 0,
				last	: Math.ceil(this._count / this._size) - 1,
			};
			
			this.$el.html(this.template(data));
	
			return this;
			
		},
		
		
		value : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.value');
			
			return this._value;
			
		},
		
		
		reset : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.reset');
			
			if (this._activated === true) {
		
				this._value = 0;
				
				this.apply(true);
				
			}
			
		},
		
		
		disable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.disable');
	
			this._disabled = true;
			
			this.invalidate();
			
		},
		
		
		enable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.enable');
			
			this._disabled = false;
			
			this.invalidate();
			
		},
		
		
		invalidate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.invalidate');
			
			this._ready = false;
			
			this.apply();
			
		},
		
		
		ready : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.ready' + ' - ' + String(this._ready));
			
			return this._ready;
			
		},
		
		
		listen : function (activated) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.listen');
			
			if (activated === true)
				this._activated = true;
			
			else
				this.collection.bind('filter:* search', this.reset);
			
		},
		
		
		apply : function (silent) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.apply');
			
			if (_.isFunction(this.options.onBeforeApply))
				this.options.onBeforeApply(this._value, this._size);
			
			else if (this._disabled === true) {
				
				this.collection.query.skip(0);
				this.collection.query.limit(PAGINATION_LIMIT);
				
				if (this.name && this.storage)
					this.storage.unset(this.name);
				
			} else {
				
				this.collection.query.skip(this._value * this._size);
				this.collection.query.limit(this._size);
				
				if (this.name && this.storage) {
					
					if (this._value > 0)
						this.storage.set(this.name, this._value + 1);
					
					else
						this.storage.unset(this.name);
					
				}
				
			}
			
			this._ready = true;
			
			if (silent !== true)
				this.collection.trigger('pagination', 'pagination', this.collection, this, this._value);
			
			this.render();
			
		},
		
		
		setCount : function (count) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.setCount');
			
			this._count = count;
			this.render();
			
		},
		
	
		recount : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.recount');
			
			if (!_.has(this.collection, 'query'))
				return;
			
			var query = JSON.stringify(this.collection.query.toJSON().where);
			
			if (this._query === query)
				return;
			
			this._query = query;
	
			var self = this;
			
			this.collection.query.count().then(
				
				function(count) {
					self.setCount(count);
				},
				function (error) {
					console.error(error.message);
				}
				
			);
			
		},
		
	
		doChangePage : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PaginationControl.doChangePage');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (!_.has(data, 'page') || data.page === this._value)
				return false;
			
			this._value = data.page;
			
			this.apply();
			
			return false;
			
		}
		
	});
	
	return view;

});