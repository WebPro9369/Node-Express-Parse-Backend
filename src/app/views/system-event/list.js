define([
    'underscore',
    'parse',
    
    'classes/system-event/collection',
    'classes/system-event/model',
    
    'views/system-event/item',
    'views/system-event/form',
    
    'controls/list/manager',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/system-event/list.html',
    
    'magnific-popup'
], function (
	_, Parse,
	SystemEventCollection, SystemEventModel,
	SystemEventItem, SystemEventForm,
	ManagerControl,
	SearchControl, PaginationControl,
	listTemplate
) {

	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="system-event-create"]'	: 'doShowForm',
			'click [data-action="system-event-update"]'	: 'doShowForm'
		},
		
		route : 'system-event',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'doShowForm', 'updateBreadcrumb');
			
			this.form = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new SystemEventCollection;
			this.collection.query = new Parse.Query(SystemEventModel);
			this.collection.query.include(['preview']);
			this.collection.query.ascending('sortOrder');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.search('q', SearchControl)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.form.systemEvent = new SystemEventForm({
				collection	: this.collection
			});
			
			
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventList.render');
			
			var data = {
				types: SystemEventModel.prototype.typeEnum
			};
	
			this.$el.html(this.template(data));
			
			this.$items = this.$('[role="items"]');
			
			this.manager.render(this);
			
			_.each(this.form, function (form, name) {
				form.setElement(this.$('[role="form"][rel="' + name + '"]')).render().fetch();
			}, this);
			
			this.$items.magnificPopup({
				delegate	: '[data-action="image-view"]',
				type		: 'image'
			});
			
		},
		
		
		fetch : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventList.refresh');
			
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
			
			var view = new SystemEventItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventList.addAll');
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="5">No matching records found</td></tr>');
				
		},
		

		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data(),
				model = data && data.id && (model = this.collection.get(data.id)) ? model : new SystemEventModel();
			
			if (_.has(data, 'type'))
				this.$('.dropdown-toggle').dropdown('toggle');
			
			if (data.action === 'system-event-create' && _.has(data, 'type'))
				model.set('type', data.type);
			
			this.form.systemEvent.build(model);
			
			return false;
			
		},
	
	
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'System Event', title: 'System Event list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});