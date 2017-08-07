define([
    'underscore',
    'parse',
    
    'classes/product-discount/collection',
    'classes/product-discount/model',
    
    'views/product-discount/item',
    'views/product-discount/form',
    
    'controls/list/manager',
    
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/product-discount/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	ProductDiscountCollection, ProductDiscountModel,
	ProductDiscountItem, ProductDiscountForm,
	ManagerControl,
	EnumFilterControl,
	SearchControl, PaginationControl,
	listTemplate
) {
	
	var publishedEnum = [
		{id: true		, text: 'Only published'},
		{id: false		, text: 'Only not published'}
	];
		
	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="product-discount-create"]'	: 'doShowForm',
			'click [data-action="product-discount-update"]'	: 'doShowForm'
		},
		
		route : 'product-discount',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'doShowForm', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new ProductDiscountCollection;
			this.collection.query = new Parse.Query(ProductDiscountModel);
			this.collection.query.include(['userGroup', 'product']);
			this.collection.query.ascending('sortOrder');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.filter(
				
				'published',
				EnumFilterControl,
				{
					type		: 'Boolean',
					datasource	: publishedEnum
				}
				
			)
			.search('q', SearchControl)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.form.productDiscount = new ProductDiscountForm({
				collection	: this.collection
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountList.render');
	
			this.$el.html(this.template());
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountList.refresh');
			
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
			
			var view = new ProductDiscountItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountList.addAll');
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="4">No matching records found</td></tr>');
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form.productDiscount.build(data && data.id && (model = this.collection.get(data.id)) ? model : new ProductDiscountModel());
			
			return false;
			
		},
		
		
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'Product Discounts', title: 'Product Discount list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});