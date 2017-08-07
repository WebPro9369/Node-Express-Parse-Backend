define([
    'underscore',
    'parse',
    
    'views/customer-profile/value/item',
    
    'text!templates/customer-profile/value/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	CustomerProfileValueItem,
	listTemplate
) {

	var view = Parse.View.extend({
	
		events : {
			'click [data-action="customer-profile-value-create"]'			: 'doValueCreate'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.initialize');
	
			_.bindAll(this, 'assign', 'sync', 'render', 'fetch',
				'addValueModel', 'removeValueModel', 'updateValueModel', 'resetValueCollection',
				'updateValueCollection', 'apply', 'doValueCreate');
			
			this.template = _.template(listTemplate);
			
			if (options.name)
				this.name = options.name;
			
			this.limit = options.limit > 0 ? options.limit : 1;
			
			this.type = options.type === 'form' ? 'form' : 'view';
			
			this.sortable = options.sortable === true;
			
			this.collections = [];
			
			var collection = new Parse.Collection();
			collection._index = 0;
			collection.bind('add', this.addValueModel);
			collection.bind('remove', this.removeValueModel);
			collection.bind('update', this.updateValueModel);
			collection.bind('reset', this.resetValueCollection);
			this.collections.push(collection);
			
			var collection = new Parse.Collection();
			collection._index = 1;
			collection.bind('add', this.addValueModel);
			collection.bind('remove', this.removeValueModel);
			collection.bind('update', this.updateValueModel);
			collection.bind('reset', this.resetValueCollection);
			this.collections.push(collection);
			
			this.datatype = undefined;
			
		},
		
		
		assign : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.assign ' + this.name);
			
			this.model = model;
			
			this.sync();
			
		},
		
		
		sync : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.sync ' + this.name);
			
			this.changeType(this.model.get(this.options.valueType));
			
			if (this.model.has(this.name)) {
				
				var value = this.model.get(this.name);
				
				if (this.datatype === 'DoublePicker') {
					
					this.collections[0].reset(value[0]);
					this.collections[1].reset(value[1]);
					
				} else {
					
					this.collections[0].reset(value);
					this.collections[1].reset();
					
				}
				
			} else {
				
				this.collections[0].reset();
				this.collections[1].reset();
				
			}
			
			var
				placeholders = this.model.get(this.options.placeholder) || [];
			
			this.$placeholder.filter('[rel="0"]').val(placeholders[0] || '');
			this.$placeholder.filter('[rel="1"]').val(placeholders[1] || '');
			
		},
		
		
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.render');
	
			this.$el.html(this.template());
			
			this.$placeholder = this.$('[name="placeholder"]');
			
			this.$items = this.$('[role="items"]');
			
			if (this.type === 'form') {
				
				if (this.sortable) {
					
					this.$items.filter('[rel="0"]').sortable({
						items	: '> [data-id]',
						handle	: '.sortable-handle',
						cursor	: 'move'
					});
					this.$items.filter('[rel="1"]').sortable({
						items	: '> [data-id]',
						handle	: '.sortable-handle',
						cursor	: 'move'
					});
		    		this.$('.sortable-handle').disableSelection();
		    		
		    	}
		    	
			}
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		addValueModel : function(model) {
			
			var index = model.collection._index;
			
			if (this.type === 'form')
				this.updateValueCollection(index);
			
			var view = new CustomerProfileValueItem({model : model, type : this.type});
			this.$items.filter('[rel="' + index + '"]').append(view.render().el);
			
		},
		
		
		removeValueModel : function(model) {
			
			var index = model.collection._index;
			
			if (this.type === 'form')
				this.updateValueCollection(index);
			
		},
		
		
		updateValueModel : function(model) {
			
			var index = model.collection._index;
			
			if (this.type === 'form')
				this.updateValueCollection(index);
			
		},
	
	
		resetValueCollection : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.resetValueCollection');
			
			var index = collection._index;
	
			this.$items.filter('[rel="' + index + '"]').html('');
			
			this.collections[index].each(this.addValueModel);
			
			this.updateValueCollection(index);
			
		},
		
		
		updateValueCollection : function(index) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.updateValueCollection');
			
			if (this.collections[index].length <= 0)
				this.$items.filter('[rel="' + index + '"]').html(
					'<tr role="empty-list">' +
					(this.type === 'form' ? '<td>&nbsp;</td>' : '') +
					'<td colspan="' + (this.type === 'form' ? '4' : '2') + '">No option values found</td></tr>')
			
			else
				this.$items.filter('[rel="' + index + '"]').find('[role="empty-list"]').remove();
			
		},
		
		
		apply : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.apply ' + this.name);
			
			// Apply placeholders
			var before = this.model.get(this.options.placeholder);
			var after = this.$placeholder.map(
				function () {
					return $(this).val();
				}
			)
			.get();
			
			if (!_.isEmpty(_.compact(after))) {
				
				if (!_.isEqual(before, after))
					this.model.set(this.options.placeholder, after);
				
			} else if (this.model.has(this.options.placeholder))
				this.model.unset(this.options.placeholder);
			
			// Apply values
			var before = this.model.get(this.name) || [];
			var after = _.map(
				this.collections,
				function (collection, index) {
					
					var values = this.sortable
					?
					collection.chain()
					.sortBy(function (model) {return _.indexOf(this, model.cid);}, this.$items.filter('[rel="' + index + '"]').sortable('toArray', {attribute: 'data-id'}))
					.filter(function (model) {return model.has('value');})
					.map(function (model) {return model.toJSON();})
					.value()
					:
					collection.chain()
					.filter(function (model) {return model.has('value');})
					.map(function (model) {return model.toJSON();})
					.value();
					
					return values;
					
				},
				this
			);
			
			if (this.datatype === 'DoublePicker') {
				
				// No changes
				
			} else
				after = _.first(after);
			
			if (!_.isEmpty(after)) {
				
				if ((this.sortable === true && !_.isEqual(before, after)) || (this.sortable !== true && !_.isEqual(_.sortBy(before), _.sortBy(after))))
					this.model.set(this.name, after);
			
			} else if (this.model.has(this.name))
				this.model.unset(this.name);
					
			return Parse.Promise.as();
					
		},
		
		
		doValueCreate : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.doValueCreate');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && _.has(data, 'index')) {
				
				var model = new Parse.Object();
			
				model.set('value', '');
				
				this.collections[data.index].add(model);
				
			}
			
			return false;
			
		},
		
		
		changeType : function (type) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileValueList.changeType');
			
			this.datatype = type;
			
			this.$('[data-values-type]').hide();
			
			if (this.datatype)
				this.$('[data-values-type~="' + this.datatype + '"]').show();
			
		}
		
		
	});
	
	return view;

});