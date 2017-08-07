define([
    'underscore',
    'moment',
    'parse',
    
    'text!templates/stylist/availability/item.html',
    
    'jquery-ui',
    'bootstrap-datepicker'
], function(
	_, moment, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {
			'show [name="date"]'								: 'doRestrictDate',
			'change [name="date"]'								: 'doChangeDate',
			'click [data-action="stylist-availability-clone"]'	: 'doClone',
			'click [data-action="stylist-availability-remove"]'	: 'doRemove'
		},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityItem.initialize');
			
			_.bindAll(this, 'render', 'doSelectTime', 'doRestrictDate', 'doChangeDate', 'doClone', 'doRemove');
			
			this.template = _.template(itemTemplate);
			
			this.type = options.type === 'form' ? 'form' : 'view'; 
			
			//this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityItem.render');
			
			this.$el.html(this.template(this.model.toTemplate()));
			
			this.$el.attr('data-id', this.model.cid);
			
			if (this.type === 'form') {
				
				this.$el.selectable({
					filter	: '.timetable-item',
					cancel	: 'td:first-child,td:last-child',
					stop	: this.doSelectTime
				});
				
				this.$('[name="date"]').bootstrapDatepicker({
					format		: 'mm/dd/yyyy',
					autoclose	: true,
					startDate	: moment.utc().toDate()
				});
			
			}
			
			return this;
			
		},
		
		
		doRestrictDate : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityItem.doRestrictDate');
			
			this.$('[name="date"]').bootstrapDatepicker('setDatesDisabled', this.model.collection.listDate(this.model));
			
		},
		
		
		doChangeDate : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityItem.doChangeDate');
			
			if (this.type !== 'form')
				return;
			
			var
				$target = $(ev.currentTarget),
				value = $target.val(),
				date = moment.utc(value).startOf('day').toDate();
			
			if (this.model.collection.checkDate(date))
				this.model.set('date', date);
			
			return false;
			
		},
		
		
		doSelectTime : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityItem.doSelectTime');
			
			if (this.type !== 'form')
				return;
			
			var time = this.$('.ui-selected').map(
				function () {
					var data = $(this).data();
					return _.has(data, 'id') ? data.id : null;
				}
			).get();
			
			if (!_.isEmpty(time))
				this.model.set('time', time);
				
			else
				this.model.unset('time');
			
		}, 
		
		
		doClone : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityItem.doClone');
			
			if (this.type !== 'form')
				return;
			
			var model = this.model.clone();
			
			model.set('date', this.model.collection.nextDate());
			
			this.model.collection.add(model);
			
			return false;
			
		}, 
		
		
		doRemove : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistAvailabilityItem.doRemove');
			
			if (this.type !== 'form')
				return;
				
			this.model.collection.remove(this.model);
			this.remove();
			
			return false;
			
		}
		
		
	});
	
	return view;

});