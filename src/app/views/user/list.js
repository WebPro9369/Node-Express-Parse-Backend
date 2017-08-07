define([
    'underscore',
    'parse',
    
    'classes/user/collection',
    'classes/user/model',
    
    'classes/user-group/collection',
    'classes/user-group/model',
    
    'views/user/item',
    'views/user/form',
    'views/user/view',
    
    'controls/list/manager',
    
    'controls/list/filter/dictionary',
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/user/list.html',
    
    'excel-builder',
    'jquery-ui'
], function (
	_, Parse,
	UserCollection, UserModel,
	UserGroupCollection, UserGroupModel,
	UserItem, UserForm, UserView,
	ManagerControl,
	DictinaryFilterControl, EnumFilterControl,
	SearchControl, PaginationControl,
	listTemplate,
	ExcelBuilder
) {
	
	var confirmedEnum = [
		{id: true		, text: 'Only confirmed'},
		{id: false		, text: 'Only not confirmed'}
	];
		
	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="user-update"]'				: 'doShowForm',
			'click [data-action="user-export"]'				: 'doExport',
			'click [data-action="user-view"]'				: 'doShowUserView'
		},
		
		route : 'user',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'doShowForm', 'doShowUserView', 'doExport', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new UserCollection;
			this.collection.query = new Parse.Query(UserModel);
			this.collection.query.descending('createdAt');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.filter(
				
				'confirmed',
				EnumFilterControl,
				{
					type		: 'Boolean',
					datasource	: confirmedEnum,
					beforeApply	: function (control, query, value) {
						
						query._removeConstraint('confirmed', 'equalTo');
						query._removeConstraint('confirmed', 'doesNotExist');
						
						if (value === true) {
							
							query.equalTo('confirmed', true);
							
						} else if (value === false) {
							
							query.doesNotExist('confirmed');
							
						}
							
					}
				}
				
			)
			.filter(
				
				'group',
				DictinaryFilterControl,
				{
					Collection	: UserGroupCollection,
					Model		: UserGroupModel,
					beforeFetch	: function (query) {
						query.ascending('name');
						query.limit(PAGINATION_LIMIT);
					},
					beforeApply	: function (control, query, value) {
						
						var val = control.value(true);
						
						if (val)
							query.equalTo('group', val);
						
						else
							query._removeConstraint('group', 'equalTo');
							
					}
				}
				
			)
			.search(
				
				'q',
				SearchControl,
				{
					field		: 'username',
					placeholder	: 'Username ...'
				}
				
			)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.view.user = new UserView({});
			
			this.form.user = new UserForm({
				collection	: this.collection
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserList.render');
	
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserList.refresh');
			
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
			
			var view = new UserItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserList.addAll');
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="7">No matching records found</td></tr>');
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form.user.build(data && data.id && (model = this.collection.get(data.id)) ? model : new UserModel());
			
			return false;
			
		},
		
		
		doShowUserView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserList.doShowUserView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data(),
				self = this;
			
			if (data && data.id && (model = this.collection.get(data.id)))
				this.view.user.fetch().then(
					
					function () {
						self.view.user.build(model);
					}
					
				);
					
				
			
			return false;
			
		},
		
		doExport : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserList.doExport');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data(),
				self = this;
			
			if (data && data.id && (model = this.collection.get(data.id))) {
				
				var
					headers = [
						'Date of Transaction', 'Customer Name', 'Email', 'Phone #', 'Customer #', 'Order #',
						'Date From', 'Date Till', 'Product Amount', 'Product Discount', 'Product Total', 'Delivery Amount',
						'Delivery Discount', 'Delivery Total', 'Insurance Amount', 'Insurance Discount', 'Insurance Total',
						'Tax', 'Total Amount', 'Total Discount', 'Discount', 'Shipping Zip Code', 'Product', 'Size',
						'Style Code', 'Color', 'Rental Price', 'Retail Price'
					],
					data = {
						productOrder : [],
						customerProfile : [],
						wishList : []
					};
				
				app.view.alert(
					null,
					'info',
					'Data export is started',
					'You will get notification when it will be finished.<br/><strong>Please don\'t leave this section until operation will be finished</strong>',
					5000
				);
				
				Parse.Promise.as().then(
					
					function () {
						
						var promises = [];
						
						var query = new Parse.Query('ProductOrder');
						query.include(['user', 'shippingAddress', 'product', 'productSize']);
						query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED]);
						query.equalTo('user', model);
						query.descending('createdAt');
						query.limit(PAGINATION_LIMIT);
						promises.push(query.find().then(
							
							function (results) {
								
								var items = _.map(results, function (order) {
									
									return [
										(order.has('user') ? order.get('user').get('fullName') : null) || null,
										(order.has('user') ? order.get('user').get('username') : null) || null,
										(order.has('user') ? order.get('user').get('username') : null) || null,
										(order.has('user') ? order.get('user').get('phoneNumber') : null) || null,
										(order.has('user') ? order.get('user').id : null) || null,
										(order.has('shippingAddress') && (shippingAddress = order.get('shippingAddress')) && shippingAddress.has('value') && (value = shippingAddress.get('value')) && _.isObject(value) ? value.postalCode : null) || null,
										order.get('orderNumber') || null,
										(moment.utc(order.createdAt).unix() / 86400 + 25569) || null,
										(order.has('dateFrom') ? moment.utc(order.get('dateFrom')).unix() / 86400 + 25569 : null) || null,
										(order.has('dateTill') ? moment.utc(order.get('dateTill')).unix() / 86400 + 25569 : null) || null,
										order.get('discountDescription') || null,
										(order.has('shippingAddress') && (shippingAddress = order.get('shippingAddress')) && shippingAddress.has('value') && (value = shippingAddress.get('value')) && _.isObject(value) ? value.city : null) || null,
										(order.has('shippingAddress') && (shippingAddress = order.get('shippingAddress')) && shippingAddress.has('value') && (value = shippingAddress.get('value')) && _.isObject(value) ? value.stateOrProvinceCode : null) || null,
										(order.has('product') ? order.get('product').get('name') : null) || null,
										(order.has('productSize') ? order.get('productSize').get('name') : null) || null,
										(order.has('product') ? order.get('product').get('styleCode') : null) || null,
										(order.has('product') ? order.get('product').get('color') : null) || null
									]
									
								});
								
								return Parse.Promise.as(_.union([['Full Name', 'Username', 'Email', 'Phone #', 'Customer #', 'Zip Code', 'Order #', 'Date of Transaction', 'Date From', 'Date Till', 'Discount', 'Shipping City', 'Shipping State', 'Product', 'Size', 'Style Code', 'Color']], items));

							}
							
						));
						
						var query = new Parse.Query('CustomerProfile');
						query.include(['parent']);
						query.equalTo('published', true);
						query.notEqualTo('isCategory', true);
						query.limit(PAGINATION_LIMIT);
						promises.push(query.find().then(
							
							function (results) {
								
								var items = _
									.chain(results)
									.sortBy(function (result) {
										return ((result.has('parent') ? result.get('parent').get('sortOrder') : null) || 0) * PAGINATION_LIMIT + (result.get('sortOrder') || 0);
									})
									.map(function (result) {
										return [
											_.compact([result.has('parent') ? result.get('parent').get('title') : null, result.get('title')]).join(' > ') || null,
											_.has(this, result.get('key')) ? (_.isArray(this[result.get('key')]) ? this[result.get('key')].join(', ') : this[result.get('key')]) : null
										]
									}, model.get('customerProfile') || {})
									.value();
								
								return Parse.Promise.as(_.union([['Title', 'Value']], items));
								
							}
							
						));
						
						var query = new Parse.Query('Product');
						query.include(['sizes']);
						query.equalTo('published', true);
						query.containedIn('objectId', _.map(model.get('productWishList'), function (value) {return value.id;}));
						query.limit(PAGINATION_LIMIT);
						query.ascending('sortOrder');
						promises.push(query.find().then(
							
							function (results) {
								
								var items = _.map(results, function (result) {
									
									return [
										result.get('name') || null,
										_.chain(result.get('sizes')).map(function (size) {return size.get('name');}).compact().value().join(', ') || null,
										result.get('styleCode') || null,
										result.get('color') || null
									];
									
								});
								
								return Parse.Promise.as(_.union([['Product', 'Sizes', 'Style Code', 'Color']], items));
								
							}
							
						));
						
						return Parse.Promise.when(promises);
						
					}
					
				).then(
					
					function (productOrder, customerProfile, wishlist) {
						
						var exportWorkbook = ExcelBuilder.Builder.createWorkbook();
						
						var productOrderWorksheet = exportWorkbook.createWorksheet({name: 'Product Order'});
						var customerProfileWorksheet = exportWorkbook.createWorksheet({name: 'Customer Profile'});
						var wishlistWorksheet = exportWorkbook.createWorksheet({name: 'Wishlist'});
						
						var stylesheet = exportWorkbook.getStyleSheet();
						
						var boldTextFormat = stylesheet.createFormat({
					        font: {
					            bold: true
					        }
					    });
	
						var datetimeFormat = stylesheet.createFormat({
							format: 'YYYY.MM.DD HH:MM:SS'
						});
						
						var dateFormat = stylesheet.createFormat({
							format: 'YYYY.MM.DD'
						});
						
						var currencyFormat = stylesheet.createFormat({
							format: '$#,##0.00'
						});
						
						productOrder = _.map(productOrder, function (row, idx) {
							
							if (idx === 0)
								return _.map(row, function (value) {return {value: value, metadata: {style: boldTextFormat.id}};});
								
							else
								return _.map(
									row,
									function (value, i) {
										return this[i] ? {value: value, metadata: {style: this[i]}} : value;
									
									},
									[
										null,
										null,
										null,
										null,
										null,
										null,
										null,
										datetimeFormat.id,
										dateFormat.id,
										dateFormat.id,
										null,
										null,
										null,
										null,
										null,
										null,
										null,
									]
								);
							
						});
						
						customerProfile = _.map(customerProfile, function (row, idx) {
							
							if (idx === 0)
								return _.map(row, function (value) {return {value: value, metadata: {style: boldTextFormat.id}};});
								
							else
								return row;
						
						});
						
						wishlist = _.map(wishlist, function (row, idx) {
							
							if (idx === 0)
								return _.map(row, function (value) {return {value: value, metadata: {style: boldTextFormat.id}};});
								
							else
								return row;
						
						});
						
						productOrderWorksheet.setData(productOrder);
						exportWorkbook.addWorksheet(productOrderWorksheet);
						
						customerProfileWorksheet.setData(customerProfile);
						exportWorkbook.addWorksheet(customerProfileWorksheet);
						
						wishlistWorksheet.setData(wishlist);
						exportWorkbook.addWorksheet(wishlistWorksheet);
						
						return ExcelBuilder.Builder.createFile(exportWorkbook);
						
					}
					
				).then(
					
					function (result) {
						
						app.view.alert(
							null,
							'success',
							'Data is ready to download',
							'Click this <a href="data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + result + '" download="armarium-user ' + model.id + '.xlsx">link</a> to open result.',
							false
						);
						
					},
					function (error) {
						
						app.view.alert(
							null,
							'danger',
							'An error occurred while exporting data',
							error,
							false
						);
						
					}
					
				);
				
				
			}
		
			return false;
		
		},
		
		
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'Users', title: 'User list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});