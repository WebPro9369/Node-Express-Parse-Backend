define([
    'underscore',
    'parse',
    
    'classes/showroom/collection',
    'classes/showroom/model',
    
    'views/showroom/item',
    'views/showroom/form',
    
    'controls/list/manager',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/showroom/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	ShowroomCollection, ShowroomModel,
	ShowroomItem, ShowroomForm,
	ManagerControl,
	SearchControl, PaginationControl,
	listTemplate
) {

	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="showroom-create"]'	: 'doShowForm',
			'click [data-action="showroom-update"]'	: 'doShowForm',
		},
		
		route : 'showroom',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'doShowForm', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new ShowroomCollection;
			this.collection.query = new Parse.Query(ShowroomModel);
			this.collection.query.ascending('name');
			this.collection.query.limit(PAGINATION_LIMIT);
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.search('q', SearchControl)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.form.showroom = new ShowroomForm({
				collection	: this.collection
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomList.render');
	
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomList.refresh');
			
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
			
			var view = new ShowroomItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomList.addAll');
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="4">No matching records found</td></tr>');
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form.showroom.build(data && data.id && (model = this.collection.get(data.id)) ? model : new ShowroomModel());
			
			return false;
			
		},
	
	
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'Showrooms', title: 'Showroom list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});