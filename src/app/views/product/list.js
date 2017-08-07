define([
    'underscore',
    'parse',
    
    'classes/collection/collection',
    'classes/collection/model',
    
    'classes/brand/collection',
    'classes/brand/model',
    
    'classes/product/collection',
    'classes/product/model',
    
    'views/product/item',
    'views/product/form',
    'views/brand/view',
    
    'controls/list/manager',
    
    'controls/list/filter/dictionary',
    
    'controls/list/search',
    'controls/list/pagination',
    'controls/list/theme',
    
    'text!templates/product/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	CollectionCollection, CollectionModel,
	BrandCollection, BrandModel,
	ProductCollection, ProductModel,
	ProductItem, ProductForm, BrandView,
	ManagerControl,
	DictinaryFilterControl,
	SearchControl, PaginationControl, ThemeControl,
	listTemplate
) {

	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="product-create"]'			: 'doShowForm',
			'click [data-action="product-update"]'			: 'doShowForm',
			'click [data-action="product-order"]'			: 'doSortUpdate',
			'click [data-action="product-order-enable"]'	: 'doSortToggle',
			'click [data-action="product-order-disable"]'	: 'doSortToggle',
			'click [data-action="brand-view"]'				: 'doShowBrandView'
		},
		
		route : 'product',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'beforeFilter', 'changeTheme', 'doShowForm', 'doShowBrandView', 'doSortChange', 'doSortUpdate', 'doSortToggle', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
			
			this.orderEnabled = false;
	
			this.template = _.template(listTemplate);
			
			this.collection = new ProductCollection;
			this.collection.query = new Parse.Query(ProductModel);
			this.collection.query.include(['brand', 'brand.image', 'brand.cover', 'sizes', 'photos', 'preview', 'stylist']);
			this.collection.query.notEqualTo('hidden', true);
			this.collection.query.descending('createdAt');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.filter(
				
				'collection',
				DictinaryFilterControl,
				{
					Collection	: CollectionCollection,
					Model		: CollectionModel,
					beforeFetch	: function (query) {
						query.notEqualTo('hidden', true);
						query.ascending('name');
						query.limit(PAGINATION_LIMIT);
					},
					beforeApply	: function (control, query, value) {
						
						if (value instanceof Parse.Object)
							query.containedIn('objectId', _.map(value.get('product'), function (item) {return item.id;}));
						
						else
							query._removeConstraint('objectId', 'containedIn');
					}
				}
				
			)
			.filter(
				
				'brand',
				DictinaryFilterControl,
				{
					Collection	: BrandCollection,
					Model		: BrandModel,
					beforeFetch	: function (query) {
						query.notEqualTo('hidden', true);
						query.ascending('name');
						query.limit(PAGINATION_LIMIT);
					}
				}
				
			)
			.search('q', SearchControl)
			.pagination('p', PaginationControl)
			.theme(
				
				'theme',
				ThemeControl,
				{
					themes	: [
						{title: 'Show as table'		, value: 'table'	, icon: 'fa fa-list-ul'},
						{title: 'Show as gallery'	, value: 'gallery'	, icon: 'fa fa-th-large'}
					],
					value	: 'table'
				}
				
			)
			.listener(this.refresh);
			
			this.collection.bind('filter:collection filter:brand search', this.beforeFilter);
			this.collection.bind('theme', this.changeTheme);
			
			this.form.product = new ProductForm({
				collection	: this.collection
			});
			
			this.view.brand = new BrandView({});
	
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.render');
	
			this.$el.html(this.template());
			
			this.$orderBtn = this.$('[data-action="product-order"]');
			this.$orderEnableBtn = this.$('[data-action="product-order-enable"]');
			this.$orderDisableBtn = this.$('[data-action="product-order-disable"]');
			
			this.$items = this.$('[role="items"]');
			
			this.manager.render(this);
			
			_.each(this.form, function (form, name) {
				form.setElement(this.$('[role="form"][rel="' + name + '"]')).render().fetch();
			}, this);
			
			_.each(this.view, function (view, name) {
				view.setElement(this.$('[role="view"][rel="' + name + '"]')).render().fetch();
			}, this);
			
			this.$items.sortable({
				items	: '> [data-id]',
				handle	: '.ui-sortable-handle > .icon-cursor-move',
				cursor	: 'move',
				update	: this.doSortChange
			});
    		this.$('.ui-sortable-handle').disableSelection();
			
		},
		
		
		fetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.refresh');
			
			return this.manager.fetch().then(
				
				null,
				function (error) {
					
					app.view.alert(
						null,
						'danger',
						'Failed to get list items',
						error.message,
						false
					);
					
				}
			
			);
			
		},
		
		
		addOne : function(model) {
			
			var view = new ProductItem({model : model, theme: this.manager.theme().value(), tagName: this.manager.theme().value() === 'gallery' ? 'div' : 'tr'});
			this.$items.append(view.render().el);
			view.updateHeight();
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.addAll');
			
			this.$orderBtn.hide();
			
			this.$items.html('');
			
			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html(this.manager.theme().value() === 'gallery' ? '<div class="col-md-12"><div class="thumbnail"><div class="caption">No matching records found</div></div></div>' : '<tr><td colspan="7">No matching records found</td></tr>');
				
		},
		
		
		beforeFilter : function (control) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.beforeFilter');
			
			if (_.isNull(this.manager.filter('collection').value()) && _.isNull(this.manager.filter('brand').value()) && !this.manager.search().value()) {
				
				if (this.orderEnabled === true) {
					
					this.$items.addClass('ui-sortable');
					this.manager.pagination().disable();
					
					this.$orderDisableBtn.show();
					
				} else {
					
					this.$items.removeClass('ui-sortable');
					this.manager.pagination().enable();
					
					this.$orderEnableBtn.show();
					
				}
				
			} else {
				
				this.$items.removeClass('ui-sortable');
				this.manager.pagination().enable();
				
				this.$orderDisableBtn.hide();
				this.$orderEnableBtn.hide();
				
			}
				
		},
		
		
		changeTheme : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.changeTheme');
			
			if (this.manager.theme().value() === 'gallery')
				this.$items.parent().addClass('table-theme-gallery');
			else
				this.$items.parent().removeClass('table-theme-gallery');
			
			this.addAll();
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form.product.build(data && data.id && (model = this.collection.get(data.id)) ? model : new ProductModel({brand: this.manager.filter('brand').value()}));
			
			return false;
			
		},
		
		
		doShowBrandView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.doShowBrandView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('brand') && (brand = model.get('brand')))
				this.view.brand.build(brand);
			
			return false;
			
		},
		
		
		doSortChange : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.doSortChange');
			
			var sort = this.$items.sortable('toArray', {attribute: 'data-id'});
			
			this.collection.each(function (model) {
				
				var order = _.indexOf(sort, model.id) + 1;
				model.doOrderChange(order);
				
			});
			
			if (_.size(this.collection.orderChanged()) > 0)
				this.$orderBtn.show();
			
			else
				this.$orderBtn.hide();
			
		},
		
		
		doSortUpdate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.doSortUpdate');
			
			this.collection.orderApply();
			
			var self = this;
			
			Parse.Object.saveAll(this.collection.changed()).then(
				
				function(result) {
					
					self.$orderBtn.hide();
					
					app.view.alert(
						null,
						'success',
						'',
						'Products successfully re-ordered',
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						null,
						'danger',
						'Failed to re-order items',
						error.message,
						false
					);
					
				}
				
			);
			
		},
		
		
		doSortToggle : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductList.doSortToggle');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data.action === 'product-order-enable') {
				
				this.orderEnabled = true;
				
				this.$orderEnableBtn.hide();
				this.$orderDisableBtn.show();
				
				this.collection.query.ascending('sortOrder');
				
			} else if (data.action === 'product-order-disable') {
				
				this.orderEnabled = false;
				
				this.$orderEnableBtn.show();
				this.$orderDisableBtn.hide();
				
				this.collection.query.descending('createdAt');
				
			} else
				return false;
				
			this.beforeFilter();
			
			return false;
			
		},
		
		
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'Products', title: 'Product list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});