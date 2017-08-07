/*
ArrayFormControl

name		: String (required) 			- Assigned attribute
Collection	: Parse.Collection (required)	- Datasource collection prototype
Model		: Parse.Object (required)		- Datasource model prototype
multiple	: Boolean (default = false)		- True if you allow multiple selection
nullable	: Boolean (default = false)		- True if you allow clear selection
scalar		: Boolean (default = false)		- True for raw value assignment
beforeFetch	: Function						- Before fetch callback with datasource query parameter

*/

define([
	'underscore',
	'parse',
	
	'jquery.sortable'
], function(
	_, Parse
) {
	
	var view = Parse.View.extend({

		events : {},
		

		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.initialize');
			
			_.bindAll(this, 'assign', 'sync', 'get', 'set', 'unset', 'fetch', 'render', 'build', 'apply');
			
			this.dictionary = null;
			
			if (options.listTemplate)
				this.templateList = _.template(options.listTemplate);
			else
				throw 'viewTemplate is not specified';
			
			if (options.itemTemplate)
				this.templateItem = _.template(options.itemTemplate);
			else
				throw 'itemTemplate is not specified';
			
			if (options.name)
				this.name = options.name;
				
			if (options.Collection && (options.Collection.prototype instanceof Parse.Collection))
				this.Collection = options.Collection
			else
				throw 'Collection must be instance of Parse.Collection';
				
			if (options.Model && (options.Model.prototype instanceof Parse.Object))
				this.Model = options.Model;
			else
				throw 'Model must be instance of Parse.Object';
				
			this.dictionary = new (this.Collection);
			this.dictionary.query = new Parse.Query(this.Model);
			
			this._value = new (this.Collection);
			
			this.dictionary.bind('reset', this.build);
			this._value.bind('reset', this.build);
			
			if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.bind('sync', this.sync);
	
		},
		
		
		assign : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.assign ' + this.name);
			
			if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.unbind('sync', this.sync);
			
			if (!((model instanceof Parse.Object) || (model instanceof Parse.User)))
				throw 'model must be instance of Parse.Object';
			
			this.model = model;
			
			this.model.bind('sync', this.sync);
			
			this.sync();
			
		},
		
		
		sync : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.sync ' + this.name);
			
			if (this.name && this.model.has(this.name)) {
				
				var value = this.model.get(this.name);
				
				if (!_.isEmpty(value))
					this.set(value);
				
				else
					this.unset();
				
			} else
				this.unset();
			
		},
		
		
		get : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.get ' + this.name);
			
			return this._value;
			
		},
		
		
		set : function (value) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.set ' + this.name);
			
			this._value.reset(value);
			
		},
		
		
		unset : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.unset ' + this.name);
			
			this._value.reset([]);
			
		},
		
		
		fetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.fetch ' + this.name);
			
			if (this.options.beforeFetch && _.isFunction(this.options.beforeFetch))
				this.options.beforeFetch(this.dictionary.query);
			
			return this.dictionary.fetch();
			
		},
		
		
		render : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.render ' + this.name);
			
			this.$el.html(this.templateList());
			
			this.$left = this.$('[role="items"][data-side="left"]');
			this.$right = this.$('[role="items"][data-side="right"]');
			
			this.$left.Sortable({
				ghostClass	: 'ui-sortable-placeholder',
				//chosenClass	: 'ui-sortable-helper',
				group		: {
					name	: 'left',
					pull	: true,
					put		: ['right']
				}
			});
			
			this.$right.Sortable({
				ghostClass	: 'ui-sortable-placeholder',
				//chosenClass	: 'ui-sortable-helper',
				sort		: false,
				group		: {
					name	: 'right',
					pull	: true,
					put		: ['left']
				}
			});
			
		},
		
		
		build : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.build ' + this.name);
			
			var
				selected = this._value.map(function (item) {return item.id;});
			
			this.$left.html('');
			this.$right.html('');
			
			this._value.each(function (item) {
				
				this.$left.append(this.templateItem(item.toTemplate()));
				
			}, this);
			
			this.dictionary.each(function (item) {
				
				if (!_.contains(selected, item.id))
					this.$right.append(this.templateItem(item.toTemplate()));
				
			}, this);
			
		},
		
		
		apply : function(refresh) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ArrayFormControl.apply ' + this.name);
			
			if (this.name) {
				
				var
					before = this._value.map(function (item) {return item.id;}),
					after = this.$left.Sortable('toArray');
				
				var
					value = _
						.chain(after)
						.unique()
						.map(function (id) {
							return this.get(id);
						}, this.dictionary)
						.compact()
						.value();
				
				if (!_.isEmpty(after)) {
				
					if (!_.isEqual(before, after))
						this.model.set(this.name, value);
				
				} else if (this.model.has(this.name))
					this.model.unset(this.name);
			}
				
			return Parse.Promise.as();
					
		}
		
		
	});
	
	return view;
	
});