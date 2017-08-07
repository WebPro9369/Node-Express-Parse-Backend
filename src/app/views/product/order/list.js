define([
    'underscore',
    'parse',
    
    'classes/product-size/collection',
    'classes/product-size/model',
    
    'classes/product-order/collection',
    'classes/product-order/model',
    
    'entities/daterange',
    
    'views/product/order/item',
    
    'controls/list/manager',
    
    'controls/list/filter/dictionary',
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/sorting',
    'controls/list/pagination',
    
    'text!templates/product/order/list.html',
    'text!templates/product/order/header.html',
    'text!templates/product/order/footer.html'
], function (
	_, Parse,
	ProductSizeCollection, ProductSizeModel,
	ProductOrderCollection, ProductOrderModel,
	DaterangeEntity,
	ProductOrderItem,
	ManagerControl,
	DictinaryFilterControl, EnumFilterControl,
	SearchControl, SortingControl, PaginationControl,
	listTemplate, headerTemplate, footerTemplate
) {
	
	var rangeLength = 14;
	
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
		},
		
		route : 'product-order',
		
		_value	: null,
		_size	: null,
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'updateBreadcrumb');
			
			this._from = moment.utc().startOf('day');
			
			this.template = _.template(listTemplate);
			this.templateHeader = _.template(headerTemplate);
			this.templateFooter = _.template(footerTemplate);
			
			this.collection = new ProductOrderCollection;
			this.collection.query = new Parse.Query(ProductOrderModel);
			this.collection.query.include(['product', 'product.brand', 'product.sizes', 'product.photos', 'product.preview', 'user', 'shippingAddress', 'paymentCard', 'productSize']);
			this.collection.query.greaterThanOrEqualTo('dateRange', this._from.toDate());
			this.collection.query.notContainedIn('state', [PRODUCT_ORDER_STATE_REFUNDED, PRODUCT_ORDER_STATE_REJECTED, PRODUCT_ORDER_STATE_CANCELED]);
			this.collection.query.descending('createdAt');
			this.collection.query.limit(PAGINATION_LIMIT);
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			var date = moment.utc().startOf('day');
			this.dateRangeEnum = _.map(
				_.times(7, function (n) {return n;}),
				function (n) {
					
					var
						from = moment.utc(date).add({days: n * rangeLength}),
						till = moment.utc(date).add({days: (n + 1) * rangeLength - 1});
						
					return {
						id: n,
						text: from.format(DATE_FORMAT) + ' - ' + till.format(DATE_FORMAT),
						from: from,
						till: till
					};
					
				},
				date
			);
			
			var self = this;
			
			this.manager = new ManagerControl(this.collection);
			
			this.manager
			.filter(
				
				'productSize',
				DictinaryFilterControl,
				{
					Collection	: ProductSizeCollection,
					Model		: ProductSizeModel,
					nullable	: false,
					beforeFetch	: function (query) {
						query.include('product');
						if (self.model instanceof Parse.Object)
							query.equalTo('product', self.model);
						query.ascending('name');
						query.limit(PAGINATION_LIMIT);
					}
				}
			
			)
			.filter(
				
				'dateRange',
				EnumFilterControl,
				{
					type		: 'Number',
					datasource	: this.dateRangeEnum,
					nullable	: false,
					beforeApply	: function (control, query, value) {
						
						if (!_.isNull(value)) {
							
							var range = new DaterangeEntity(moment.utc(date).add({days: value * rangeLength}), moment.utc(date).add({days: (value + 1) * rangeLength - 1}));
							
							query.containedIn(this.name, range.range());
							
						} else
							query._removeConstraint(this.name, 'containedIn');
							
					}
				}
				
			)
			.listener(this.refresh);
			
		},
		
		
		assign : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.assign');
			
			this.model = model;
			
			this.collection.query.equalTo('product', model);
			
			this.manager.filter('productSize').reset();
			this.manager.filter('dateRange').reset();
			
			this.fetch();
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.render');
	
			this.$el.html(this.template());
			
			this.$header = this.$('[role="header"]');
			this.$items = this.$('[role="items"]');
			this.$footer = this.$('[role="footer"]');
			
			this.manager.render(this);
			
		},
		
		
		fetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.refresh');
			
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
		
		
		addOne : function(model, range) {
			
			var view = new ProductOrderItem({model : model, range: range});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderList.addAll');
	
			this.$header.html('');
			this.$items.html('');
			this.$footer.html('');
			
			if (!this.manager.filter('dateRange').value(true))
				return this.$items.html('<tr><td class="col-md-5" colspan="3">&mdash;</td><td class="col-md-7" colspan="14">Date range is not specified</td></tr>');
			
			var
				dateRange = this.manager.filter('dateRange').value(true),
				lookupRange = new DaterangeEntity(dateRange.from, dateRange.till);
			
			if (!lookupRange.defined())
				return this.$items.html('<tr><td class="col-md-5" colspan="3">&mdash;</td><td class="col-md-7" colspan="14">Date range is not specified</td></tr>');
			
			var
				productSize = this.manager.filter('productSize').value();
			
			if (!(productSize instanceof Parse.Object))
				return this.$items.html('<tr><td class="col-md-5" colspan="3">&mdash;</td><td class="col-md-7" colspan="14">Product size is not specified</td></tr>');
			
			var productSizeAvailability = {};
					
			//---
			//console.log('Fill product size quantities');
			
			productSizeAvailability = _.fillWith(lookupRange.range(true), productSize.get('quantity') || 0);
			
			//console.log(JSON.stringify(productSizeAvailability, null, '\t'));
			
			//---
			//console.log('Decrease product size quantities');
			
			this.collection.each(function (productOrder) {
				
				_
				.chain(productOrder.get('dateRange'))
				.invoke('valueOf')
				.intersection(lookupRange.range(true))
				.increment(productSizeAvailability, -1)
				.value();
				
			});
			
			//console.log(JSON.stringify(productSizeAvailability, null, '\t'));
			
			var headers = ['Number', 'Date range', 'State'];
			
			_.reduce(lookupRange.range(), function (memo, date) {
					
					var
						m = moment.utc(date),
						res = {year: m.years(), month: m.months()};
					
					var format = DATE_FORMAT;
					
					if (memo && memo.month === res.month)
						format = DATE_FORMAT_DAY;
					
					else if (memo && memo.year === res.year)
						format = DATE_FORMAT_MONTH;
					
					this.push(m.format(format));
					
					return res;
					
				}, null, headers);
			
			var footers = _.flatten(
				[
					['&nbsp;', '&nbsp;', '&nbsp;'],
					_.values(productSizeAvailability)
				]
			);
			
			this.$header.html(this.templateHeader({items: headers}));
			this.$footer.html(this.templateFooter({items: footers}));
			

			if (this.collection.length > 0)
				this.collection.each(function (model) {return this.addOne(model, lookupRange.range(true));}, this);
				
			else
				this.$items.html('<tr><td class="col-md-5" colspan="3">&mdash;</td><td class="col-md-7" colspan="14">No orders found</td></tr>');
				
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