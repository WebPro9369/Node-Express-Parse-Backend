define([
    'underscore',
    'parse',
    
    'classes/product/collection',
	'classes/product/model',
	
	'classes/product-size/collection',
	'classes/product-size/model',
    
    'classes/product-order/model',
    
    'entities/daterange',
    
    'controls/form/dictionary',
    'controls/form/enum',
    
    'text!templates/product-order/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
    'icheck',
    'bootstrap-datepicker'
], function (
	_, Parse,
	ProductCollection, ProductModel,
	ProductSizeCollection, ProductSizeModel,
	ProductOrderModel,
	DaterangeEntity,
	DictionaryFormControl, EnumFormControl,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {
			'changeDate [name="dateFrom"]'	: 'doDateChange',
			'changeDate [name="dateTill"]'	: 'doDateChange'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit', 'doProductChange', 'doDateChange');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.product = new DictionaryFormControl({
				name		: 'product',
				Collection	: ProductCollection,
				Model		: ProductModel,
				nullable	: true,
				beforeFetch	: function (query) {
					query.include('sizes');
					query.ascending('name');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
			this.control.productSize = new DictionaryFormControl({
				name		: 'productSize',
				Collection	: ProductSizeCollection,
				Model		: ProductSizeModel,
				nullable	: true,
				beforeFetch	: function (query) {
					query.ascending('name');
					query.limit(1);
				}
			});
			
			this.control.product.bind('change', this.doProductChange);
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderForm.fetch');
			
			var promises = [];
			
			_.each(this.control, function (control, name) {
				promises.push(control.fetch());
			});
			
			return Parse.Promise.when(promises).then(

				null,
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while building product order form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
					product	: {
						required : true
					},
					productSize	: {
						required : true
					},
					dateFrom : {
						required : true
					},
					dateTill : {
						required : true
					}
				},
				submitHandler	: this.submit
			});
			
			this.$('.input-daterange').bootstrapDatepicker({
				format		: 'mm/dd/yyyy'
			});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Product order</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					dateFrom			: function ($control, value) {$control.val(value && (date = moment.utc(value)) && date.isValid() ? date.format('MM/DD/YYYY') : '').bootstrapDatepicker('clearDates');},
					dateTill			: function ($control, value) {$control.val(value && (date = moment.utc(value)) && date.isValid() ? date.format('MM/DD/YYYY') : '').bootstrapDatepicker('clearDates');}
				}
			);
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					dateFrom		: function ($control, value) {return (date = moment.utc(value)) && date.isValid() ? date.toDate() : undefined;},
					dateTill		: function ($control, value) {return (date = moment.utc(value)) && date.isValid() ? date.toDate() : undefined;}
				}
			);
			
			var dateRange = new DaterangeEntity(this.model.get('dateFrom'), this.model.get('dateTill'));
			
			if (dateRange.defined())
				this.model.set('dateRange', dateRange.range());
			
			this.model.addUnique('state', PRODUCT_ORDER_STATE_LOCKED);
			
			var promises = [];
			
			_.each(this.control, function (control, name) {
				promises.push(control.apply());
			});
			
			Parse.Promise.when(promises).then(
				
				function () {
					
			 		return self.model.save();
			 		
				}
				
			).then(
				
				function (result) {
					
					self.$('.modal').modal('hide');
					
					self.collection.fetch();
					
					app.view.alert(
						null,
						'success',
						'',
						'Product order successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the product order',
						error.message,
						false 
					);
					
				}
			
			);
	
			return false;
	
		},
		
		
		doProductChange : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderForm.doProductChange');
			
			var product = this.control.product.value();

			if (product instanceof Parse.Object)			
				this.control.productSize.fetch(product.has('sizes') ? product.get('sizes') : []);
			
			else
				this.control.productSize.fetch([]);
				
		},
		

		doDateChange : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderForm.doDateChange');
			
			this.$el.valid();
		
		}
		
		
	});
	
	return view;

});