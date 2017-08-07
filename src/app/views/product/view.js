define([
	'underscore',
	'numeral',
	'parse',
	
	'views/image/list',
	'views/product/size/list',
	'views/product/order/list',
	
	'text!templates/product/view.html',
	
	'mCustomScrollbar'
], function (
	_, numeral, Parse,
	ImageList, ProductSizeList, ProductOrderList,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.control = {};
	
			this.template = _.template(viewTemplate);
			
			this.control.photos = new ImageList({
				name		: 'photos',
				type		: 'view',
				limit		: 10,
				multiple	: true,
				sortable	: true
			});
			
			this.control.preview = new ImageList({
				name		: 'preview',
				type		: 'view'
			});
			
			this.control.sizes = new ProductSizeList({
				name		: 'sizes',
				type		: 'view',
				multiple	: true
			});
			
			this.control.order = new ProductOrderList({
				name		: 'order'
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductView.render');
	
			this.$el.html(this.template());
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			if ($.fn.mCustomScrollbar)
				this.$('.mCustomScrollbar').mCustomScrollbar({
					autoHideScrollbar: true,
					theme: 'dark',
					set_height: 200,
					advanced: {
						updateOnContentResize: true
					}
				});
			
			return this;
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductView.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductView.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Product</strong> view <span class="pull-right">' + this.model.id + '</span>');
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					brand					: function ($control, value) {$control.html(value instanceof Parse.Object ? value.get('name') : '&mdash;');},
					price					: function ($control, value) {$control.html(numeral(value).format(MONEY_FORMAT));},
					retailPrice				: function ($control, value) {$control.html(numeral(value).format(MONEY_FORMAT));},
					deliveryPrice			: function ($control, value) {$control.html(numeral(value).format(MONEY_FORMAT));},
					insurancePrice			: function ($control, value) {$control.html(numeral(value).format(MONEY_FORMAT));},
					delayBefore				: function ($control, value) {$control.html(numeral(value).format(NUMBER_FORMAT));},
					delayAfter				: function ($control, value) {$control.html(numeral(value).format(NUMBER_FORMAT));},
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