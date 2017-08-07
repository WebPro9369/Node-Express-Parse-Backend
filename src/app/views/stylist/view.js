define([
    'underscore',
	'numeral',
	'parse',
	
	'views/image/list',
	'views/stylist/availability/list',
    
    'text!templates/stylist/view.html',
    
    'mCustomScrollbar'
], function (
	_, numeral, Parse,
	ImageList, StylistAvailabilityList,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.control = {};
			
			this.template = _.template(viewTemplate);
			
			this.control.photo = new ImageList({
				name		: 'photo',
				type		: 'view'
			});
			
			this.control.image = new ImageList({
				name		: 'image',
				type		: 'view'
			});
			
			this.control.availability = new StylistAvailabilityList({
				type		: 'view'
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistView.render');
	
			this.$el.html(this.template());
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			if ($.fn.mCustomScrollbar)
				this.$('.mCustomScrollbar').mCustomScrollbar({
					autoHideScrollbar	: true,
					theme				: 'dark',
					set_height			: 200,
					advanced			: {
						updateOnContentResize: true
					}
				});
			
			return this;
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistView.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Stylist</strong> view <span class="pull-right">' + this.model.id + '</span>');
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					type						: function ($control, value, model) {$control.html(model.format('_type') || '&mdash;');},
					gender						: function ($control, value, model) {$control.html(model.format('_gender') || '&mdash;');},
					previousJob					: function ($control, value) {

						value = value || [];
						
						$control.filter('[rel="0"]').html(value[0] || '&mdash;');
						$control.filter('[rel="1"]').html(value[1] || '&mdash;');
						
					},
					showroom					: function ($control, value) {$control.html(value instanceof Parse.Object ? value.get('name') : '&mdash;');},
					notificatedAt				: function ($control, value) {$control.html(value ? 'Push notification sent at ' + moment(value).format(DATETIME_FORMAT) : 'Push notification not sent yet');},
					primary						: function ($control, value) {$control.html(value === true ? 'Yes' : 'No');},
					published					: function ($control, value) {$control.html(value === true ? 'Yes' : 'No');}
				},
				{
					attribute	: 'data-name',
					method		: 'html',
					defaultValue: '&mdash;'
				}
			);
			
			if (type = this.model.get('type')) {
				
				this.$('[data-stylist-type="' + type + '"]').show();
				this.$('[data-stylist-type][data-stylist-type!="' + type + '"]').hide();
				
			} else
				this.$('[data-stylist-type]').hide();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		}
		
		
	});
	
	return view;

});