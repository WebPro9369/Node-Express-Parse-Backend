define([
    'underscore',
    'parse',
    
    'classes/agenda/collection',
    'classes/agenda/model',
    
    'views/agenda/item',
    'views/agenda/form',
    
    'controls/list/manager',
    
    'controls/list/search',
    'controls/list/pagination',
    
    'text!templates/agenda/list.html',
    
    'jquery-ui'
], function (
	_, Parse,
	AgendaCollection, AgendaModel,
	AgendaItem, AgendaForm,
	ManagerControl,
	SearchControl, PaginationControl,
	listTemplate
) {

	var view = Parse.View.extend({
	
		el : '#body',
		
		events : {
			'click [data-action="agenda-create"]'	: 'doShowForm',
			'click [data-action="agenda-update"]'	: 'doShowForm',
			'click [data-action="agenda-order"]'	: 'doSortUpdate'
		},
		
		route : 'agenda',
		
	
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'refresh', 'addOne', 'addAll', 'beforeFilter', 'doShowForm', 'doSortChange', 'doSortUpdate', 'updateBreadcrumb');
			
			this.form = {};
	
			this.template = _.template(listTemplate);
			
			this.collection = new AgendaCollection;
			this.collection.query = new Parse.Query(AgendaModel);
			this.collection.query.include(['thumbImage', 'listImage', 'coverImage', 'bannerImage', 'gridImage', 'gridBottomImage', 'browseImage']);
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
			
			this.form.agenda = new AgendaForm({
				collection	: this.collection
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.render');
			
			var data = {
				themes: AgendaModel.prototype.themeEnum
			};
			
			this.$el.html(this.template(data));
			
			this.$orderBtn = this.$('[data-action="agenda-order"]');
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.fetch');
			
			this.manager.invalidate();
			
		},
		
		
		refresh : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.refresh');
			
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
			
			var view = new AgendaItem({model : model});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.addAll');
			
			this.$orderBtn.hide();
			
			this.$items.html('');

			if (this.collection.length > 0)
				this.collection.each(this.addOne);
				
			else
				this.$items.html('<tr><td colspan="3">No matching records found</td></tr>');
				
		},
		
		
		beforeFilter : function (control) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.beforeFilter');
			
			if (!this.manager.search().value()) {
				
				this.$items.addClass('ui-sortable');
				this.manager.pagination().disable();
				
			} else {
				
				this.$items.removeClass('ui-sortable');
				this.manager.pagination().enable();
				
			}
				
		},
		

		doShowForm : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.doShowForm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data(),
				model = data && data.id && (model = this.collection.get(data.id)) ? model : new AgendaModel();
			
			if (_.has(data, 'theme'))
				this.$('.dropdown-toggle').dropdown('toggle');
			
			if (data.action === 'agenda-create' && _.has(data, 'theme'))
				model.set('theme', data.theme);
			
			this.form.agenda.build(model);
			
			return false;
			
		},
		
		
		doSortChange : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.doSortChange');
			
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaList.doSortUpdate');
			
			this.collection.orderApply();
			
			var self = this;
			
			Parse.Object.saveAll(this.collection.changed()).then(
				
				function(result) {
					
					self.$orderBtn.hide();
					
					app.view.alert(
						null,
						'success',
						'',
						'Agenda successfully re-ordered',
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
			path.push({text: 'Agenda', title: 'Agenda list'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
	});
	
	return view;

});