define([
    'underscore',
    'parse',
    
    'classes/user/model',
    'classes/shipping-address/model',
    'classes/payment-card/model',
    
    'classes/product/collection',
    'classes/product/model',
    
    'classes/product-size/collection',
    'classes/product-size/model',
    
    'classes/product-order/collection',
    'classes/product-order/model',
    
    'views/product-order/item',
    'views/product-order/form',
    'views/product-order/view',
    'views/product-order/export/form',
    'views/product/view',
    'views/user/view',
    'views/shipping-address/view',
    'views/payment-card/view',
    
    'controls/list/manager',
    
    'controls/list/filter/dictionary',
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/sorting',
    'controls/list/pagination',
    'controls/list/theme',
    
    'text!templates/product-order/list.html'
], function (
	_, Parse,
	UserModel, ShippingAddressModel, PaymentCardModel,
	ProductCollection, ProductModel,
	ProductSizeCollection, ProductSizeModel,
	ProductOrderCollection, ProductOrderModel,
	ProductOrderItem, ProductOrderForm, ProductOrderView, ProductOrderExportForm, ProductView, UserView, ShippingAddressView, PaymentCardView,
	ManagerControl,
	DictinaryFilterControl, EnumFilterControl,
	SearchControl, SortingControl, PaginationControl, ThemeControl,
	listTemplate
) {
	
	var typeEnum = [
		{id: 1, text: 'New orders today'},
		{id: 2, text: 'Awaiting delivery'},
		{id: 3, text: 'Delivery is overdue'},
		{id: 4, text: 'Awaiting return'},
		{id: 5, text: 'Return is overdue'}
	];

	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="product-order-create"]'	: 'doShowForm',
			'click [data-action="product-order-export"]'	: 'doShowExportForm',
			'click [data-action="product-order-view"]'		: 'doShowProductOrderView',
			'click [data-action="product-view"]'			: 'doShowProductView',
			'click [data-action="user-view"]'				: 'doShowUserView',
			'click [data-action="shipping-address-view"]'	: 'doShowShippingAddressView',
			'click [data-action="payment-card-view"]'		: 'doShowPaymentCardView'
		},
		
		route : 'product-order',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'applyType', 'changeTheme', 'doShowForm', 'doShowExportForm', 'doShowProductOrderView', 'doShowProductView', 'doShowUserView', 'doShowShippingAddressView', 'doShowPaymentCardView', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new ProductOrderCollection;
			this.collection.query = new Parse.Query(ProductOrderModel);
			this.collection.query.include(['productDiscounts', 'product', 'product.brand', 'product.sizes', 'product.photos', 'product.preview', 'user', 'shippingAddress', 'paymentCard', 'productSize']);
			this.collection.query.descending('createdAt');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			var self = this;
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			if (!app.locationManager.has('type'))
				this.manager
				.filter(
				
					'product',
					DictinaryFilterControl,
					{
						Collection	: ProductCollection,
						Model		: ProductModel,
						beforeFetch	: function (query) {
							query.ascending('name');
							query.limit(PAGINATION_LIMIT);
						}
					}
					
				)
				.filter(
					
					'productSize',
					DictinaryFilterControl,
					{
						Collection	: ProductSizeCollection,
						Model		: ProductSizeModel,
						beforeFetch	: function (query) {
							query.equalTo('product', self.manager.filter('product').value());
							query.ascending('name');
							query.limit(PAGINATION_LIMIT);
						}
					}
				
				)
				.filter(
					
					'state',
					EnumFilterControl,
					{
						type		: 'Number',
						datasource	: ProductOrderModel.prototype.stateEnum
					}
				
				);
			
			else
				this.manager
				.filter(
					
					'type',
					EnumFilterControl,
					{
						type		: 'Number',
						datasource	: typeEnum,
						beforeApply	: this.applyType
					}
				
				);
			
			this.manager
			.search('q', SearchControl)
			.sorting(
				
				's',
				SortingControl,
				{
					fields	: [
						{title: 'Order date'	, attribute: 'createdAt'	, css: 'col-md-1'},
						{title: 'Number'		, attribute: 'orderNumber'	, css: 'col-md-1'},
						{title: 'Product / Size'							, css: 'col-md-3'},
						{title: 'Date range'	, attribute: 'dateFrom'		, css: 'col-md-2'},
						{title: 'Price'			, attribute: 'totalPrice'	, css: 'col-md-1'},
						{title: 'Source'									, css: 'col-md-1'},
						{title: 'State'										, css: 'col-md-2'},
						{title: 'Actions'									, css: 'col-md-1'}
					],
					value	: '-createdAt'
				}
				
			)
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
			
			if (!app.locationManager.has('type'))
				this.collection.bind('filter:product', function () {
					
					if (self.manager.filter('product').value() instanceof Parse.Object)
						self.manager.filter('productSize').enable();
						
					else
						self.manager.filter('productSize').disable();
						
				});
			
			this.collection.bind('theme', this.changeTheme);
			
			this.form.productOrder = new ProductOrderForm({collection	: this.collection});
			this.form.productOrderExport = new ProductOrderExportForm();
			this.view.productOrder = new ProductOrderView({});
			this.view.product = new ProductView({});
			this.view.user = new UserView({});
			this.view.shippingAddress = new ShippingAddressView({});
			this.view.paymentCard = new PaymentCardView({});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.render');
	
			this.$el.html(this.template());
			
			this.$items = this.$('[role="items"]');
			
			this.manager.render(this);
			
			_.each(this.form, function (form, name) {
				form.setElement(this.$('[role="form"][rel="' + name + '"]')).render().fetch();
			}, this);
			
			_.each(this.view, function (view, name) {
				view.setElement(this.$('[role="view"][rel="' + name + '"]')).render().fetch();
			}, this);
			
		},
		
		
		fetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.refresh');
			
			var self = this;
			
			return this.manager.fetch().then(
				
				function () {
					
					if (app.locationManager.has('order') && (model = self.collection.get(app.locationManager.get('order')))) {
						
						self.view.productOrder.build(model);
						app.locationManager.unset('order')
						
					}
						
				},
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
			
			var view = new ProductOrderItem({model : model, theme: this.manager.theme().value(), tagName: this.manager.theme().value() === 'gallery' ? 'div' : 'tr'});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.addAll');
	
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html(this.manager.theme().value() === 'gallery' ? '<div class="col-md-12"><div class="thumbnail"><div class="caption">No matching records found</div></div></div>' : '<tr><td colspan="8">No matching records found</td></tr>');
				
		},
		
		
		applyType : function(control, query, value) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.applyType');
			
			var
				now = moment.utc();
			
			query._removeConstraint('createdAt', 'greaterThanOrEqualTo');
			query._removeConstraint('dateFrom', 'equalTo');
			query._removeConstraint('dateFrom', 'lessThan');
			query._removeConstraint('dateTill', 'equalTo');
			query._removeConstraint('dateTill', 'lessThan');
			query._removeConstraint('state', 'containsAll');
			query._removeConstraint('state', 'notContainedIn');
			
			// New orders today
			if (value === 1) {
				
				query.greaterThanOrEqualTo('createdAt', moment.utc(now).subtract({days: 1}).toDate());
			
			} else if (_.contains([2, 3], value)) {
				
				query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED]);
				query.notContainedIn('state', [PRODUCT_ORDER_STATE_DELIVERED, PRODUCT_ORDER_STATE_RETURNED, PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED]);
				
				// Awaiting delivery
				if (value === 2)
					query.equalTo('dateFrom', moment.utc(now).startOf('day').add({days: 1}).toDate());
				
				// Delivery is overdue
				else if (value === 3)
					query.lessThan('dateFrom', now.toDate());
			
			} else if (_.contains([4, 5], value)) {
				
				query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED, PRODUCT_ORDER_STATE_DELIVERED]);
				query.notContainedIn('state', [PRODUCT_ORDER_STATE_RETURNED, PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED]);
				
				// Awaiting return
				if (value === 4)
					query.equalTo('dateTill', moment.utc(now).startOf('day').add({days: 1}).toDate());
				
				//	Return is overdue
				else if (value === 5)
					query.lessThan('dateTill', now.toDate());
				
			}
			
			
		},
		
		
		changeTheme : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.changeTheme');
			
			if (this.manager.theme().value() === 'gallery')
				this.$items.parent().addClass('table-theme-gallery');
			else
				this.$items.parent().removeClass('table-theme-gallery');
			
			this.addAll();
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.doShowForm');
			
			this.form.productOrder.build(new ProductOrderModel());
			
			return false;
			
		},
		
		
		doShowExportForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.doShowExportForm');
			
			this.form.productOrderExport.build();
			
			return false;
			
		},
		
		
		doShowProductOrderView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.doShowProductOrderView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)))
				this.view.productOrder.build(model);
			
			return false;
			
		},
		
		
		doShowProductView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.doShowProductView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('product') && (product = model.get('product')))
				this.view.product.build(product);
			
			return false;
			
		},
		
		
		doShowUserView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.doShowUserView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('user') && (user = model.get('user')))
				this.view.user.build(user);
			
			return false;
			
		},
		
		
		doShowShippingAddressView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.doShowShippingAddressView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('shippingAddress') && (shippingAddress = model.get('shippingAddress')))
				this.view.shippingAddress.build(shippingAddress);
			
			return false;
			
		},
		
		
		doShowPaymentCardView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.doShowPaymentCardView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('paymentCard') && (paymentCard = model.get('paymentCard')))
				this.view.paymentCard.build(paymentCard);
			
			return false;
			
		},
		
		
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'Product Orders', title: 'Product Order list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});