define([
    'underscore',
    'parse',
    
    'classes/customer-profile/collection',
    'classes/customer-profile/model',
    
    'views/customer-profile/item',
    'views/customer-profile/form',
    
    'controls/list/manager',
    
    'controls/list/filter/dictionary',
    'controls/list/filter/enum',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/customer-profile/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	CustomerProfileCollection, CustomerProfileModel,
	CustomerProfileItem, CustomerProfileForm,
	ManagerControl,
	DictinaryFilterControl, EnumFilterControl,
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
			'click [data-action="customer-profile-create"]'	: 'doShowForm',
			'click [data-action="customer-profile-update"]'	: 'doShowForm',
			'click [data-action="customer-profile-order"]'	: 'doSortUpdate'
		},
		
		route : 'customer-profile',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'doShowForm', 'doSortChange', 'doSortUpdate', 'updateBreadcrumb');
			
			this.form = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new CustomerProfileCollection;
			this.collection.query = new Parse.Query(CustomerProfileModel);
			this.collection.query.ascending('sortOrder');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.filter(
				
				'parent',
				DictinaryFilterControl,
				{
					Collection	: CustomerProfileCollection,
					Model		: CustomerProfileModel,
					beforeFetch	: function (query) {
						query.equalTo('isCategory', true);
						query.ascending('title');
						query.limit(PAGINATION_LIMIT);
					},
					beforeApply	: function (control, query, value) {
						
						query._removeConstraint('parent', 'equalTo');
						query._removeConstraint('parent', 'doesNotExist');
						
						if (value instanceof Parse.Object)
							query.equalTo('parent', value);
						
						else
							query.doesNotExist('parent');
							
					}
				}
				
			)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.manager.pagination().disable();
			
			this.form.customerProfile = new CustomerProfileForm({
				collection	: this.collection
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.render');
	
			this.$el.html(this.template());
			
			this.$orderBtn = this.$('[data-action="customer-profile-order"]');
			
			this.$items = this.$('[role="items"]');
			
			this.manager.render(this);
			
			_.each(this.form, function (form, name) {
				form.setElement(this.$('[role="form"][rel="' + name + '"]')).render().fetch();
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.refresh');
			
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
			
			var view = new CustomerProfileItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.addAll');
			
			this.$orderBtn.hide();
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="4">No matching records found</td></tr>');
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data(),
				model = data && data.id && (model = this.collection.get(data.id)) ? model : new CustomerProfileModel();
			
			if (model.isNew()) {
				
				if (data && data.group === true)
					model.set('isCategory', true);
				
				if ((parent = this.manager.filter('parent').value()) && (parent instanceof Parse.Object))
					model.set('parent', parent);
				
			}
			
			this.form.customerProfile.build(model);
			
			return false;
			
		},
		
		
		doSortChange : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.doSortChange');
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.doSortUpdate');
			
			this.collection.orderApply();
			
			var self = this;
			
			Parse.Object.saveAll(this.collection.changed()).then(
				
				function(result) {
					
					self.$orderBtn.hide();
					
					app.view.alert(
						null,
						'success',
						'',
						'Customer Profile Options successfully re-ordered',
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
			path.push({text: 'Customer Profile Options', title: 'Customer Profile Option list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});