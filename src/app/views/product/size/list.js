define([
    'underscore',
    'parse',
    
    'classes/product-size/collection',
    'classes/product-size/model',
    
    'views/product/size/item',
    
    'text!templates/product/size/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	ProductSizeCollection, ProductSizeModel,
	ProductSizeItem,
	listTemplate
) {

	var view = Parse.View.extend({
	
		events : {
			'click [data-action="product-size-create"]'			: 'doSizeCreate'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.initialize');
	
			_.bindAll(this, 'assign', 'sync', 'render', 'fetch', 'total', 'rangeUS', 'addSizeModel', 'removeSizeModel', 'updateSizeModel', 'resetSizeCollection', 'updateSizeCollection', 'apply', 'doSizeCreate', 'makeSizeCreate');
			
			this.template = _.template(listTemplate);
			
			if (options.name)
				this.name = options.name;
			
			this.limit = options.limit > 0 ? options.limit : 1;
			
			this.type = options.type === 'form' ? 'form' : 'view';
			
			this.multiple = options.multiple === true;
			this.sortable = options.sortable === true;
			
			this.collection = new ProductSizeCollection;
			this.collection.bind('add', this.addSizeModel);
			this.collection.bind('remove', this.removeSizeModel);
			this.collection.bind('update', this.updateSizeModel);
			this.collection.bind('reset', this.resetSizeCollection);
			
			/*if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.bind('sync', this.sync);*/
			
		},
		
		
		assign : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.assign ' + this.name);
			
			/*if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.unbind('sync', this.sync);
			
			if (!((model instanceof Parse.Object) || (model instanceof Parse.User)))
				throw 'model must be instance of Parse.Object';*/
			
			this.model = model;
			
			//this.model.bind('sync', this.sync);
			
			this.sync();
			
		},
		
		
		sync : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.sync ' + this.name);
			
			if (this.name && this.model.has(this.name)) {
				
				var value = this.model.get(this.name);
				
				this.collection.reset(_.isArray(value) ? value : [value]);
				
				
			} else
				this.collection.reset();
			
		},
		
		
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.render');
	
			this.$el.html(this.template());
			
			this.$items = this.$('[role="items"]');
			
			if (this.type === 'form') {
				
				if (this.sortable) {
					
					this.$items.sortable({
						items	: '> [data-id]',
						handle	: '.sortable-handle',
						cursor	: 'move'
					});
		    		this.$('.sortable-handle').disableSelection();
		    		
		    	}
		    	
			}
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		total : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.total');
			
			return this.collection.total();
			
		},
		
		
		rangeUS : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.rangeUS');
			
			return this.collection.rangeUS();
			
		},
	
	
		addSizeModel : function(model) {
			
			if (this.type === 'form')
				this.updateSizeCollection();
			
			var view = new ProductSizeItem({model : model, type : this.type});
			this.$items.append(view.render().el);
			
		},
		
		
		removeSizeModel : function(model) {
			
			if (this.type === 'form')
				this.updateSizeCollection();
			
		},
		
		
		updateSizeModel : function(model) {
			
			if (this.type === 'form')
				this.updateSizeCollection();
			
		},
	
	
		resetSizeCollection : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.resetSizeCollection');
	
			this.$items.html('');
			
			this.collection.each(this.addSizeModel);
			
			this.updateSizeCollection();
			
		},
		
		
		updateSizeCollection : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.updateSizeCollection');
			
			this.$('[role="product-form-total-quantity"]').html(this.collection.total() || 'Not available');
			
			if (this.collection.length <= 0)
				this.$items.html(
					'<tr role="empty-list">' +
					(this.type === 'form' ? '<td>&nbsp;</td>' : '') +
					'<td colspan="' + (this.type === 'form' ? '3' : '2') + '">No available size found</td></tr>')
			
			else
				this.$items.find('[role="empty-list"]').remove();
			
		},
		
		
		apply : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.apply ' + this.name);
			
			if (this.name) {
				
				this.collection.each(
					
					function (model) {
						
						if (!model.has('product') && (this.model instanceof Parse.Object))
							model.set('product', this.model._toPointer()); // To prevent recursion
							
					},
					this
					
				);
				
				if (this.multiple) {
					
					var items = this.sortable ? this.collection.ordered(this.$items.sortable('toArray', {attribute: 'data-id'})) : this.collection.unordered();
					
					var before = _.map(this.model.get(this.name), function (item) {return item.id;});
					var after = _.map(items, function (item) {return item.id;});
					
					if (!_.isEmpty(after)) {
						
						if ((this.sortable === true && !_.isEqual(before, after)) || (this.sortable !== true && !_.isEqual(_.sortBy(before), _.sortBy(after))))
							this.model.set(this.name, items);
					
					} else if (this.model.has(this.name))
						this.model.unset(this.name);
					
				} else {
					
					if ((model = this.collection.first()) && (model instanceof Parse.Object)) {

						if (!this.model.has(this.name) || this.model.get(this.name).id !== model.id)
							this.model.set(this.name, model);
					
					} else if (this.model.has(this.name))
						this.model.unset(this.name);
					
				}
				
			}
			
			return Parse.Promise.as();
					
		},
		
		
		doSizeCreate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.doSizeCreate');
			
			this.makeSizeCreate();
			
			return false;
			
		},
		
		
		makeSizeCreate : function (name, quantity) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductSizeList.makeSizeCreate');
			
			if (name) {
				
				var search = this.collection.filter(function (item) {return item.get('name') === name;});
				
				if (!_.isEmpty(search))
					return;
				
			}
			
			var model = new ProductSizeModel();
			
			if (name)
				model.set('name', name);
			
			model.set('quantity', quantity || 0);
			
			this.collection.add(model);
			
		}
		
		
	});
	
	return view;

});