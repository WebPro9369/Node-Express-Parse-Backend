define([
    'underscore',
    'parse',
    
    'classes/content/collection',
    'classes/content/model',
    
    'views/content/item',
    'views/content/form',
    
    'controls/list/manager',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/content/list.html',
    
    'magnific-popup'
], function (
	_, Parse,
	ContentCollection, ContentModel,
	ContentItem, ContentForm,
	ManagerControl,
	SearchControl, PaginationControl,
	listTemplate
) {

	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="content-create"]'	: 'doShowForm',
			'click [data-action="content-update"]'	: 'doShowForm'
		},
		
		route : 'content',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'doShowForm', 'updateBreadcrumb');
			
			this.form = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new ContentCollection;
			this.collection.query = new Parse.Query(ContentModel);
			this.collection.query.include(['preview']);
			this.collection.query.ascending('sortOrder');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.search('q', SearchControl)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.form.content = new ContentForm({
				collection	: this.collection
			});
			
			
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentList.render');
	
			this.$el.html(this.template());
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentList.refresh');
			
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
			
			var view = new ContentItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentList.addAll');
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="5">No matching records found</td></tr>');
				
		},
		

		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data(),
				model = data && data.id && (model = this.collection.get(data.id)) ? model : new ContentModel();
			
			if (data.action === 'content-create')
				model.set('type', data.type === 'image' ? 'image' : 'text');
			
			this.form.content.build(model);
			
			return false;
			
		},
	
	
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'Content', title: 'Content list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});