define([
    'underscore',
    'parse',
    
    'classes/stylist-availability/collection',
    'classes/stylist-availability/model',
    
    'views/stylist/availability/item',
    
    'text!templates/stylist/availability/list.html'
], function (
	_, Parse,
	StylistAvailabilityCollection, StylistAvailabilityModel,
	StylistAvailabilityItem,
	listTemplate
) {
	
	var AVAILABLE_TIME_RANGE = {0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM', 5: '5 AM', 6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM', 12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM', 18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM'};

	var view = Parse.View.extend({
	
		events : {
			'click [data-action="stylist-availability-create"]'			: 'doItemCreate'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.initialize');
	
			_.bindAll(this, 'assign', 'sync', 'render', 'fetch', 'addItemModel', 'removeItemModel', 'updateItemModel', 'resetItemCollection', 'updateItemCollection', 'apply', 'doItemCreate');
			
			this.template = _.template(listTemplate);
			
			if (options.name)
				this.name = options.name;
			
			this.limit = options.limit > 0 ? options.limit : 1;
			
			this.type = options.type === 'form' ? 'form' : 'view';
			
			this.multiple = options.multiple === true;
			this.sortable = options.sortable === true;
			
			this.collection = new StylistAvailabilityCollection;
			this.collection.query = new Parse.Query(StylistAvailabilityModel);
			this.collection.query.ascending('date');
			this.collection.query.limit(PAGINATION_LIMIT);
			this.collection.bind('add', this.addItemModel);
			this.collection.bind('remove', this.removeItemModel);
			this.collection.bind('update', this.updateItemModel);
			this.collection.bind('reset', this.resetItemCollection);
			
			/*if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.bind('sync', this.sync);*/
			
		},
		
		
		assign : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.assign ' + this.name);
			
			/*if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.unbind('sync', this.sync);
			
			if (!((model instanceof Parse.Object) || (model instanceof Parse.User)))
				throw 'model must be instance of Parse.Object';*/
			
			this.model = model;
			
			if (!this.model.isNew()) {
				
				this.collection.query.greaterThanOrEqualTo('date', moment.utc().startOf('day').toDate());
				this.collection.query.equalTo('stylist', model);
				
				return this.collection.fetch();
				
			} else
				this.collection.reset();
			
			//this.model.bind('sync', this.sync);
			
			//this.sync();
			
		},
		
		
		sync : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.sync ' + this.name);
			
			/*if (this.name && this.model.has(this.name)) {
				
				var value = this.model.get(this.name);
				
				this.collection.reset(_.isArray(value) ? value : [value]);
				
				
			} else
				this.collection.reset();*/
			
		},
		
		
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.render');
	
			this.$el.html(this.template({range: AVAILABLE_TIME_RANGE}));
			
			this.$items = this.$('[role="items"]');
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		addItemModel : function(model) {
			
			if (this.type === 'form')
				this.updateItemCollection();
			
			var view = new StylistAvailabilityItem({model : model, type : this.type, range: AVAILABLE_TIME_RANGE});
			this.$items.append(view.render().el);
			
		},
		
		
		removeItemModel : function(model) {
			
			if (this.type === 'form')
				this.updateItemCollection();
			
		},
		
		
		updateItemModel : function(model) {
			
			if (this.type === 'form')
				this.updateItemCollection();
			
		},
	
	
		resetItemCollection : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.resetItemCollection');
	
			this.$items.html('');
			
			this.collection.each(this.addItemModel);
			
			this.updateItemCollection();
			
		},
		
		
		updateItemCollection : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.updateItemCollection');
			
			if (this.collection.length <= 0)
				this.$items.html(
					'<tr role="empty-list">' +
					'<td colspan="' + (this.type === 'form' ? '26' : '25') + '">No available dates found</td></tr>');
			
			else
				this.$items.find('[role="empty-list"]').remove();
			
		},
		
		
		apply : function(reference) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.apply');
			
			if (reference === true) {
			
				this.collection.each(
					
					function (model) {
						
						if (!model.has('stylist') && (this.model instanceof Parse.Object))
							model.set('stylist', this.model._toPointer()); // To prevent recursion
							
					},
					this
					
				);
				
				return Parse.Object.saveAll(this.collection.changed());
			
			} else
				return Parse.Promise.as();
					
		},
		
		
		doItemCreate : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityList.doItemCreate');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			_.times(data && data.count ? data.count : 1, function () {
				
				var model = new StylistAvailabilityModel();
			
				model.set('date', this.collection.nextDate());
				
				this.collection.add(model);
				
			}, this);
			
			
			return false;
			
		}
		
		
	});
	
	return view;

});