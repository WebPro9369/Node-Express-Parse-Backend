define([
    'underscore',
    'parse',
    
    'views/image/list',
    
    'text!templates/brand/view.html',
    
    'mCustomScrollbar'
], function (
	_, Parse,
	ImageList,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.control = {};
			
			this.template = _.template(viewTemplate);
			
			this.control.image = new ImageList({
				name		: 'image',
				type		: 'view'
			});
			
			this.control.cover = new ImageList({
				name		: 'cover',
				type		: 'view'
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandView.render');
	
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandView.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Brand</strong> view <span class="pull-right">' + this.model.id + '</span>');
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					published				: function ($control, value) {$control.html(value === true ? 'Yes' : 'No');}
				},
				{
					attribute	: 'data-name',
					method		: 'html',
					defaultValue: '&mdash;'
				}
			);
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		}
		
		
	});
	
	return view;

});