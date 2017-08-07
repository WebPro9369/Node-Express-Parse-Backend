define([
    'underscore',
    'parse',
    
    'classes/user-group/collection',
    'classes/user-group/model',
    
    'views/user-group/item',
    'views/user-group/form',
    
    'controls/list/manager',
    
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/user-group/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	UserGroupCollection, UserGroupModel,
	UserGroupItem, UserGroupForm,
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
			'click [data-action="user-group-create"]'	: 'doShowForm',
			'click [data-action="user-group-update"]'	: 'doShowForm'
		},
		
		route : 'user-group',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserGroupList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'doShowForm', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new UserGroupCollection;
			this.collection.query = new Parse.Query(UserGroupModel);
			this.collection.query.include('image', 'cover');
			this.collection.query.ascending('sortOrder');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.search('q', SearchControl)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.form.userGroup = new UserGroupForm({
				collection	: this.collection
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserGroupList.render');
	
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserGroupList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserGroupList.refresh');
			
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
			
			var view = new UserGroupItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserGroupList.addAll');
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="3">No matching records found</td></tr>');
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserGroupList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form.userGroup.build(data && data.id && (model = this.collection.get(data.id)) ? model : new UserGroupModel());
			
			return false;
			
		},
		
		
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'User Groups', title: 'User Group list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});