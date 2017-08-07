define([
    'underscore',
    'parse',
    
    'classes/brand/collection',
    'classes/brand/model',
    
    'views/brand/item',
    'views/brand/form',
    
    'controls/list/manager',
    
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/brand/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	BrandCollection, BrandModel,
	BrandItem, BrandForm,
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
			'click [data-action="brand-create"]'	: 'doShowForm',
			'click [data-action="brand-update"]'	: 'doShowForm',
			'click [data-action="brand-order"]'		: 'doSortUpdate'
		},
		
		route : 'brand',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'beforeFilter', 'doShowForm', 'doSortChange', 'doSortUpdate', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new BrandCollection;
			this.collection.query = new Parse.Query(BrandModel);
			this.collection.query.include('image', 'cover');
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
			
			this.form.brand = new BrandForm({
				collection	: this.collection
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.render');
	
			this.$el.html(this.template());
			
			this.$orderBtn = this.$('[data-action="brand-order"]');
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.refresh');
			
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
			
			var view = new BrandItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.addAll');
			
			this.$orderBtn.hide();
	
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="4">No matching records found</td></tr>');
				
		},
		
		
		beforeFilter : function (control) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.beforeFilter');
			
			if (_.isNull(this.manager.filter('published').value()) && !this.manager.search().value()) {
				
				this.$items.addClass('ui-sortable');
				this.manager.pagination().disable();
				
			} else {
				
				this.$items.removeClass('ui-sortable');
				this.manager.pagination().enable();
				
			}
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form.brand.build(data && data.id && (model = this.collection.get(data.id)) ? model : new BrandModel());
			
			return false;
			
		},
		
		
		doSortChange : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.doSortChange');
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandList.doSortUpdate');
			
			this.collection.orderApply();
			
			var self = this;
			
			Parse.Object.saveAll(this.collection.changed()).then(
				
				function(result) {
					
					self.$orderBtn.hide();
					
					app.view.alert(
						null,
						'success',
						'',
						'Brands successfully re-ordered',
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
			path.push({text: 'Brands', title: 'Brand list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});