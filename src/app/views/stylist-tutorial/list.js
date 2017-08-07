define([
    'underscore',
    'parse',
    
    'classes/stylist-tutorial/collection',
    'classes/stylist-tutorial/model',
    
    'views/stylist-tutorial/item',
    'views/stylist-tutorial/form',
    
    'controls/list/manager',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/stylist-tutorial/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	StylistTutorialCollection, StylistTutorialModel,
	StylistTutorialItem, StylistTutorialForm,
	ManagerControl,
	SearchControl, PaginationControl,
	listTemplate
) {

	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="stylist-tutorial-create"]'	: 'doShowForm',
			'click [data-action="stylist-tutorial-update"]'	: 'doShowForm',
			'click [data-action="stylist-tutorial-order"]'	: 'doSortUpdate'
		},
		
		route : 'stylist-tutorial',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'beforeFilter', 'doShowForm', 'doSortChange', 'doSortUpdate', 'updateBreadcrumb');
			
			this.form = {};
			this.view = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new StylistTutorialCollection;
			this.collection.query = new Parse.Query(StylistTutorialModel);
			this.collection.query.include(['preview']);
			this.collection.query.notEqualTo('hidden', true);
			this.collection.query.ascending('sortOrder');
			this.collection.bind('add', this.addOne);
			this.collection.bind('reset', this.addAll);
			
			this.manager = new ManagerControl(this.collection, app.locationManager);
			
			this.manager
			.search('q', SearchControl)
			.pagination('p', PaginationControl)
			.listener(this.refresh);
			
			this.collection.bind('search', this.beforeFilter);
			
			this.form.stylistTutorial = new StylistTutorialForm({
				collection	: this.collection
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.render');
	
			this.$el.html(this.template());
			
			this.$orderBtn = this.$('[data-action="stylist-tutorial-order"]');
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.refresh');
			
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
			
			var view = new StylistTutorialItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.addAll');
			
			this.$orderBtn.hide();
	
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="4">No matching records found</td></tr>');
				
		},
		
		
		beforeFilter : function (control) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.beforeFilter');
			
			if (!this.manager.search().value()) {
				
				this.$items.addClass('ui-sortable');
				this.manager.pagination().disable();
				
			} else {
				
				this.$items.removeClass('ui-sortable');
				this.manager.pagination().enable();
				
			}
				
		},
		
		
		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			this.form.stylistTutorial.build(data && data.id && (model = this.collection.get(data.id)) ? model : new StylistTutorialModel());
			
			return false;
			
		},
		
		
		doSortChange : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.doSortChange');
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialList.doSortUpdate');
			
			this.collection.orderApply();
			
			var self = this;
			
			Parse.Object.saveAll(this.collection.changed()).then(
				
				function(result) {
					
					self.$orderBtn.hide();
					
					app.view.alert(
						null,
						'success',
						'',
						'Stylist tutorials successfully re-ordered',
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
			path.push({text: 'Stylist Tutorials', title: 'Stylist tutorial list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});