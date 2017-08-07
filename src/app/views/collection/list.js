define([
    'underscore',
    'parse',
    
    'classes/brand/collection',
    'classes/brand/model',
    
    'classes/collection/collection',
    'classes/collection/model',
    
    'views/collection/item',
    'views/collection/form',
    'views/brand/view',
    
    'controls/list/manager',
    
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/collection/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	BrandCollection, BrandModel,
	CollectionCollection, CollectionModel,
	CollectionItem, CollectionForm, BrandView,
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
			'click [data-action="collection-create"]'	: 'doShowForm',
			'click [data-action="collection-update"]'	: 'doShowForm',
			'click [data-action="brand-view"]'			: 'doShowBrandView',
			'click [data-action="collection-order"]'	: 'doSortUpdate'
		},
		
		route : 'collection',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'beforeFilter', 'doShowForm', 'doSortChange', 'doSortUpdate', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new CollectionCollection;
			this.collection.query = new Parse.Query(CollectionModel);
			this.collection.query.select(['name', 'seasonDescription', 'private', 'published']);
			//this.collection.query.include(['preview', 'cover']);
			this.collection.query.notEqualTo('hidden', true);
			this.collection.query.ascending('sortOrder');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.filter(
				
				'published',
				EnumFilterControl,
				{
					type		: 'Boolean',
					datasource	: publishedEnum
				}
			
			)
			.search('q', SearchControl)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.collection.bind('filter:published search', this.beforeFilter);
			
			this.form.collection = new CollectionForm({
				collection	: this.collection
			});
			
			this.view.brand = new BrandView({});
	
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.render');
	
			this.$el.html(this.template());
			
			this.$orderBtn = this.$('[data-action="collection-order"]');
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.refresh');
			
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
			
			var view = new CollectionItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.addAll');
			
			this.$orderBtn.hide();
	
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="5">No matching records found</td></tr>');
				
		},
		
		
		beforeFilter : function (control) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.beforeFilter');
			
			if (_.isNull(this.manager.filter('published').value()) && !this.manager.search().value()) {
				
				this.$items.addClass('ui-sortable');
				this.manager.pagination().disable();
				
			} else {
				
				this.$items.removeClass('ui-sortable');
				this.manager.pagination().enable();
				
			}
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form.collection.prebuild(data && data.id && (model = this.collection.get(data.id)) ? model : new CollectionModel({}));
			
			return false;
			
		},
		
		
		doShowBrandView : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.doShowBrandView');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (data && data.id && (model = this.collection.get(data.id)) && model.has('brand') && (brand = model.get('brand')))
				this.view.brand.build(brand);
			
			return false;
			
		},
		
		
		doSortChange : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.doSortChange');
			
			var sort = this.$items.sortable('toArray', {attribute: 'data-id'});
			
			this.collection.each(function (model) {
				
				var order = _.indexOf(sort, model.id) + 1;
				model.doOrderChange(order);
				
			});
			
			if (_.size(this.collection.orderChanged()) > 0)
				this.$orderBtn.show();
			
			else
				this.$orderBtn.hide();
			
		},
		
		
		doSortUpdate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionList.doSortUpdate');
			
			this.collection.orderApply();
			
			var self = this;
			
			Parse.Object.saveAll(this.collection.changed()).then(
				
				function(result) {
					
					self.$orderBtn.hide();
					
					app.view.alert(
						null,
						'success',
						'',
						'Collections successfully re-ordered',
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						null,
						'danger',
						'Failed to re-order items',
						error.message,
						false
					);
					
				}
				
			);
			
		},
	
	
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page', route: 'dashboardView'});
			path.push({text: 'Collections', title: 'Collection list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});