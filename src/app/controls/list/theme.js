/*
ThemeControl

collection	: Parse.Collection (required)	- Sorted collection
name		: String			 			- Storage key
value		: String						- Initial value
disabled	: Boolean						- Disable control
storage		: StorageManager				- StorageManager instance to hold values

*/

define([
    'jquery',
    'underscore',
    'parse',
    
    'text!./theme/template.html'
], function(
	$, _, Parse,
	viewTemplate
) {
	
	var view = Parse.View.extend({

		tagName : 'tr',
	
		events : {
			'click [data-theme]'		: 'doChangeTheme'
		},
		
		_themes : [],
		
		_value : null,
		_default : null,
		_disabled : null,
		_ready : null,
		

		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.initialize');
			
			_.bindAll(this, 'render', 'value', 'def', 'reset', 'disable', 'enable', 'invalidate', 'ready', 'apply', 'doChangeTheme');
			
			this.template = _.template(viewTemplate);
			
			this._ready = false;
			
			if (_.has(options, 'name') && _.isString(options.name) && !_.isEmpty(options.name))
				this.name = options.name;
			
			
			if (_.has(options, 'storage'))
				this.storage = options.storage;
			
			this._themes = [];
			
			if (_.isArray(options.themes)) {
				
				this._themes = options.themes;
				
			} else
				throw 'themes must be array';
			
			if (this.name && this.storage && this.storage.has(this.name)) {
				
				var value = this.storage.get(this.name, '');
				
				if (_.findWhere(this._themes, {value: value}))
					this._value = value;

			} else 
				this._value = null;
			
			if (_.has(options, 'value') && _.isString(options.value) && _.findWhere(this._themes, {value: options.value}))
				this._default = options.value;
			
			else
				this._default = null;
			
		},
	
	
		render : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.render');
			
			var data = {
				themes		: this._themes,
				value		: this.value()
			};
			
			this.$el.html(this.template(data));
	
			return this;
			
		},
		
		
		value : function (raw) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.value');
			
			if (raw === true)
				return this._value;
				
			return this._value || this._default || null;
			
		},
		
		
		def : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.def');
			
			return this._default;
			
		},
		
		
		reset : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.reset');
	
			this._value = null;
			
			this.apply();
			
		},
		
		
		disable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.disable');
	
			this._disabled = true;
			
			this.invalidate();
			
		},
		
		
		enable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.enable');
			
			this._disabled = false;
			
			this.invalidate();
			
		},
		
		
		invalidate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.invalidate');
			
			this._ready = false;
			
			this.apply();
			
		},
		
		
		ready : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.ready' + ' - ' + String(this._ready));
			
			return this._ready;
			
		},
		
		
		apply : function (silent) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.apply');
			
			var value = this.value();
			
			if (this.name && this.storage) {
				
				var
					value = this.value(true)
					def = this.def(true);
				
				if (value && value !== def)
					this.storage.set(this.name, value);
				
				else
					this.storage.unset(this.name);
				
			}
			
			this._ready = true;
			
			if (silent !== true)
				this.collection.trigger('theme', 'theme', this.collection, this, this._value);
			
			this.render();
			
		},
	
	
		doChangeTheme : function(ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ThemeControl.doChangeTheme');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.theme && _.findWhere(this._themes, {value: data.theme})) {

				this._value = data.theme;
				
				this.apply();
				
			}
			
			return false;
			
		}
		
	});
	
	return view;
	
});