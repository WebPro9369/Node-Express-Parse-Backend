define([
    'underscore',
    'parse',
    
    'classes/push-status/collection',
    'classes/push-status/model',
    
    'views/push-status/item',
    'views/push-status/form',
    
    'controls/list/manager',
    
    'controls/list/pagination',
    
    'text!templates/push-status/list.html'
], function (
	_, Parse,
	PushStatusCollection, PushStatusModel,
	PushStatusItem, PushStatusForm,
	ManagerControl,
	PaginationControl,
	listTemplate
) {
	
	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="push-status-create"]'	: 'doShowForm',
		},
		
		route : 'push-status',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refetch', 'refresh', 'updatePagination', 'addOne', 'addAll', 'doShowForm', 'updateBreadcrumb');
			
			this._page = 0;
			this._limit = 1;
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new PushStatusCollection;
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager, {onBeforeFetch	: this.refetch});
			
			this.manager
			.pagination(
				'p',
				PaginationControl,
				{
					onBeforeApply	: this.updatePagination
				}
			)
			.listener(this.refresh);
			
			this.form['push-status'] = new PushStatusForm({parentView: this});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusList.render');
	
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusList.refetch');
			
			var self = this;
			
			var params = {
				page	: this._page,
				limit	: this._limit
			};
			
			return Parse.Cloud.run('listPushNotification', params);
			
		},
		

		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusList.refresh');
			
			var self = this;
			
			return this.manager.fetch().then(
				
				function (result) {
					
					if (_.isObject(result)) {
						
						self.manager.pagination().setCount(_.has(result, 'count') && _.isNumber(result.count) && result.count > 0 ? result.count : 0);
						self.collection.reset(_.has(result, 'results') && _.isArray(result.results) ? result.results : []);
						
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
		
		
		updatePagination : function(page, limit) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusList.updatePagination');
			
			if (!_.isUndefined(page))
				this._page = page;
			
			if (!_.isUndefined(limit))
				this._limit = limit;
		
		},
		
		
		addOne : function(model) {
			
			var view = new PushStatusItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusList.addAll');
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="5">No matching records found</td></tr>');
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form['push-status'].build();
			
			return false;
			
		},
		
		
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'Notifications', title: 'Notification list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});