define([
    'underscore',
    'parse',
    
    'classes/user/model',
    'classes/shipping-address/model',
    'classes/payment-card/model',
    
    'classes/stylist/collection',
    'classes/stylist/model',
    
    'classes/stylist-order/collection',
    'classes/stylist-order/model',
    
    'views/stylist-order/item',
    'views/stylist-order/view',
    'views/stylist/view',
    'views/user/view',
    'views/shipping-address/view',
    'views/payment-card/view',
    
    'controls/list/manager',
    
    'controls/list/filter/dictionary',
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/sorting',
    'controls/list/pagination',
    
    'text!templates/stylist-order/list.html'
], function (
	_, Parse,
	UserModel, ShippingAddressModel, PaymentCardModel,
	StylistCollection, StylistModel,
	StylistOrderCollection, StylistOrderModel,
	StylistOrderItem, StylistOrderView, StylistView, UserView, ShippingAddressView, PaymentCardView,
	ManagerControl,
	DictinaryFilterControl, EnumFilterControl,
	SearchControl, SortingControl, PaginationControl,
	listTemplate
) {

	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="stylist-order-view"]'		: 'doShowStylistOrderView',
			'click [data-action="stylist-view"]'			: 'doShowStylistView',
			'click [data-action="user-view"]'				: 'doShowUserView',
			'click [data-action="shipping-address-view"]'	: 'doShowShippingAddressView',
			'click [data-action="payment-card-view"]'		: 'doShowPaymentCardView'
		},
		
		route : 'stylist-order',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'doShowStylistOrderView', 'doShowStylistView', 'doShowUserView', 'doShowShippingAddressView', 'doShowPaymentCardView', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new StylistOrderCollection;
			this.collection.query = new Parse.Query(StylistOrderModel);
			this.collection.query.include(['stylist', 'stylist.showroom', 'stylist.photo', 'user', 'shippingAddress', 'showroom', 'paymentCard']);
			this.collection.query.descending('createdAt');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.filter(
			
				'stylist',
				DictinaryFilterControl,
				{
					Collection	: StylistCollection,
					Model		: StylistModel,
					beforeFetch	: function (query) {
						query.ascending('fullName');
						query.limit(PAGINATION_LIMIT);
					}
				}
			)
			.filter(
				
				'state',
				EnumFilterControl,
				{
					type		: 'Number',
					datasource	: StylistOrderModel.prototype.stateEnum
				}
				
			)
			.search('q', SearchControl)
			.sorting(
				
				's',
				SortingControl,
				{
					fields	: [
						{title: 'Order date'	, attribute: 'createdAt'	, css: 'col-md-2'},
						{title: 'Number'		, attribute: 'orderNumber'	, css: 'col-md-1'},
						{title: 'Stylist'									, css: 'col-md-3'},
						{title: 'Date / Time'	, attribute: 'orderDate'	, css: 'col-md-2'},
						{title: 'Price'			, attribute: 'totalPrice'	, css: 'col-md-1'},
						{title: 'State'										, css: 'col-md-2'},
						{title: 'Actions'									, css: 'col-md-1'}
					],
					value	: '-createdAt'
				}
				
			)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.view.stylistOrder = new StylistOrderView({});
			this.view.stylist = new StylistView({});
			this.view.user = new UserView({});
			this.view.shippingAddress = new ShippingAddressView({});
			this.view.paymentCard = new PaymentCardView({});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.render');
	
			this.$el.html(this.template());
			
			this.$items = this.$('[role="items"]');
			
			this.manager.render(this);
			
			_.each(this.view, function (view, name) {
				view.setElement(this.$('[role="view"][rel="' + name + '"]')).render().fetch();
			}, this);
			
		},
		
		
		fetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.refresh');
			
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
			
			var view = new StylistOrderItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.addAll');
	
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="7">No matching records found</td></tr>');
				
		},
		
		
		doShowStylistOrderView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.doShowStylistOrderView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)))
				this.view.stylistOrder.build(model);
			
			return false;
			
		},
		
		
		doShowStylistView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.doShowStylistView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('stylist') && (stylist = model.get('stylist')))
				this.view.stylist.build(stylist);
			
			return false;
			
		},
		
		
		doShowUserView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.doShowUserView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('user') && (user = model.get('user')))
				this.view.user.build(user);
			
			return false;
			
		},
		
		
		doShowShippingAddressView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.doShowShippingAddressView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('shippingAddress') && (shippingAddress = model.get('shippingAddress')))
				this.view.shippingAddress.build(shippingAddress);
			
			return false;
			
		},
		
		
		doShowPaymentCardView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistOrderList.doShowPaymentCardView');
			
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
			path.push({text: 'Stylist Orders', title: 'Stylist Order list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});