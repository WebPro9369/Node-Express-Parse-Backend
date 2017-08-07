define([
    'parse',

    'views/app',
    'views/dashboard',
    
    'views/brand/list',
    
    'views/collection/list',
    
    'views/product/list',
    
    'views/product-discount/list',
    
    'views/product-order/list',
    
    'views/stylist-tutorial/list',
    
    'views/showroom/list',
    
    'views/stylist/list',
    
    'views/stylist-order/list',
    
    'views/agenda/list',
    
    'views/system-event/list',
    
    'views/content/list',
    
    'views/customer-profile/list',
    
    'views/user-group/list',
    'views/user/list',
    
    'views/push-status/list',
    
    'views/signup',
    'views/login'
], function(
		Parse,
		AppView, DashboardView,
		BrandList,
		CollectionList,
		ProductList,
		ProductDiscountList,
		ProductOrderList,
		StylistTutorialList,
		ShowroomList,
		StylistList,
		StylistOrderList,
		AgendaList,
		SystemEventList,
		ContentList,
		CustomerProfileList,
		UserGroupList, UserList,
		PushStatusList,
		SignupView, LoginView
	) {

	var router = Parse.Router.extend({
	
		context : '#body',
	
		routes : {
			
			''								: 'dashboardView',
			
			'brand/'						: 'brandList',
			
			'collection/'					: 'collectionList',
			
			'product/'						: 'productList',
			
			'product-discount/'				: 'productDiscountList',
			
			'product-order/'				: 'productOrderList',
			
			'stylist-tutorial/'				: 'stylistTutorialList',
			
			'showroom/'						: 'showroomList',
			
			'stylist/'						: 'stylistList',
			
			'stylist-order/'				: 'stylistOrderList',
			
			'agenda/'						: 'agendaList',
			
			'system-event/'					: 'systemEventList',
			
			'content/'						: 'contentList',
			
			'customer-profile/'				: 'customerProfileList',
			
			'user-group/'					: 'userGroupList',
			
			'user/'							: 'userList',
			
			'push-status/'					: 'pushStatusList',
			
			'signup'						: 'signupForm',
			
			'login'							: 'loginForm',
			'logout'						: 'logoutForm'
			
		},
		
		view : null,
	
	
		initialize : function() {
			
			_.bindAll(this, /*'_routeToRegExp', '_parse', '_update', '_arg', '_generate', '_current',*/ 'assign');
			
		},
		
		
		assign : function(View, options, isAppView, needAuth, restrictRole, callback) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.assign');
			
			var self = this;
			
			if (app.view && app.view.body) {
				app.view.body.undelegateEvents();
				app.view.body = null;
			}
			
			if (app.view && !isAppView) {
				app.view.undelegateEvents();
				app.view = null;
			}
			
			$(this.context).html('');
			
			if (needAuth == true && !Parse.User.current()) {
				this.navigate("login", true);
				return null;
			}
			
			var promise = new Parse.Promise.as();
			
			app.settings = {};
			
			if (Parse.User.current() && _.isEmpty(app.user)) {
				
				promise = promise.then(
					
					function () {
						
						app.user = {
							roles			: [],
							hasAdminRole	: false
						};
						
						return Parse.Cloud.run('userRoleList', {});
					}
					
				).then(
					
					function (result) {
						
						app.user.roles = result;
						
						app.user.hasAdminRole = _.contains(app.user.roles, ROLE_ADMIN);
						
						return Parse.Promise.as();
					}
					
				);
				
			}
			
			if (isAppView && !app.view) {
				
				promise = promise.then(
					
					function () {
						app.view = new AppView();
						app.view.render();
						return Parse.Promise.as();
					}
					
				);
			}
			
			promise = promise.then(
				
				function () {
					
					if (restrictRole && _.isEmpty(_.intersection(app.user.roles, restrictRole))) {
						
						app.view.render403();
						app.view.breadcrumb.reset([{text: 'Home', title: 'Home page', route: 'dashboardView'}, {text: 'Access denied', title: 'Access denied'}]);
						app.view.updateMenu();
						
						return;
						
					}
					
					var view = new View(options);
					
					if (isAppView) {
						if (_.isFunction(view.updateBreadcrumb)) view.updateBreadcrumb();
						else app.view.breadcrumb.reset();
						app.view.updateMenu(view.route);
					}
					
					if (isAppView)
						app.view.body = view;

					if (callback) {
						callback = _.bind(callback, view);
						callback();
					}
					
				},
				function (error) {
					
					console.error(error.message);
					
					Parse.User.logOut();
					
					app.user = {};
					
					self.navigate('login', true);
					
				}
			
			);
			
		},

	
		dashboardView : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.dashboardView');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				DashboardView,
				{},
				true,
				true,
				null,
				function () {
					this.render();
				}
			);
			
		},
		
		
		brandList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.brandList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				BrandList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		collectionList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.collectionList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				CollectionList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		productList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.productList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				ProductList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		productDiscountList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.productDiscountList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				ProductDiscountList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		productOrderList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.productOrderList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				ProductOrderList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		stylistTutorialList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.stylistTutorialList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				StylistTutorialList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		showroomList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.showroomList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				ShowroomList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		stylistList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.stylistList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				StylistList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		stylistOrderList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.stylistOrderList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				StylistOrderList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		agendaList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.agendaList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				AgendaList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		systemEventList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.systemEventList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				SystemEventList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		contentList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.contentList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				ContentList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		customerProfileList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.customerProfileList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				CustomerProfileList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		userGroupList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.userGroupList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				UserGroupList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		userList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.userList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				UserList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		pushStatusList : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.pushStatusList');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				PushStatusList,
				{},
				true,
				true,
				[ROLE_ADMIN],
				function () {
					this.render();
					this.fetch();
				}
			);
			
		},
		
		
		signupForm : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.signupForm');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				SignupView,
				{},
				false,
				false,
				null,
				function () {
					this.render();
				}
			);
			
		},
		
		
		loginForm : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.loginForm');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			this.assign(
				LoginView,
				{},
				false,
				false,
				null,
				function () {
					this.render();
				}
			);
			
		},
	
	
		logoutForm : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppRouter.logoutForm');
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log(arguments);
			
			if (app.view && app.view.body) app.view.body.undelegateEvents();
			
			Parse.User.logOut();
			
			app.user = {};
			
			this.navigate('login', true);
			
		}
		
	});
	
	return router;

});