define([
    'underscore',
    'parse',
    
    'classes/user-group/collection',
	'classes/user-group/model',
    
    'classes/product/collection',
	'classes/product/model',
    
    'classes/product-discount/model',
    
    'controls/form/dictionary',
    'controls/form/array',
    'controls/form/enum',
    
    'text!templates/product-discount/form.html',
    'text!templates/product-discount/user-group/list.html',
    'text!templates/product-discount/user-group/item.html',
    'text!templates/product-discount/product/list.html',
    'text!templates/product-discount/product/item.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
    'icheck',
    'bootstrap-datepicker'
], function (
	_, Parse,
	UserGroupCollection, UserGroupModel,
	ProductCollection, ProductModel,
	ProductDiscountModel,
	DictionaryFormControl, ArrayFormControl, EnumFormControl,
	formTemplate, userGroupListTemplate, userGroupItemTemplate, productListTemplate, productItemTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {
			'change [name="condition"]' : 'doChangeCondition'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit', 'doChangeCondition');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.userGroup = new ArrayFormControl({
				name		: 'userGroup',
				Collection	: UserGroupCollection,
				Model		: UserGroupModel,
				listTemplate: userGroupListTemplate,
				itemTemplate: userGroupItemTemplate,
				beforeFetch	: function (query) {
					query.ascending('name');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
			this.control.product = new ArrayFormControl({
				name		: 'product',
				Collection	: ProductCollection,
				Model		: ProductModel,
				listTemplate: productListTemplate,
				itemTemplate: productItemTemplate,
				beforeFetch	: function (query) {
					query.ascending('name');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
			this.control.condition = new EnumFormControl({
				name		: 'condition',
				datasource	: ProductDiscountModel.prototype.conditionEnum,
				multiple	: true,
				nullable	: true
			});
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountForm.fetch');
			
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
						'An error occurred while building collection form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			this.$tabUserGroup = this.$('[href="#product-discount-form-user-group"]').parent();
			this.$tabProduct = this.$('[href="#product-discount-form-product"]').parent();
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
					title : {
						required : true
					},
					oldType : {
						number : true
					},
					priority : {
						number : true
					},
					productDiscount : {
						number : true
					},
					deliveryDiscount : {
						number : true
					},
					insuranceDiscount : {
						number : true
					},
					totalDiscount : {
						number : true
					}
				},
				submitHandler	: this.submit
			});
			
			this.$('.datepicker').bootstrapDatepicker({
				format		: 'mm/dd/yyyy'
			});
			
			this.$('[name="published"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Product Discount</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			var discountValueDecoder = function ($control, value) {

				value = value || {};
				
				_.each(['valueNumber', 'valuePercent', 'valuePercentMin', 'valuePercentMax'], function (name) {
					
					$control.filter('[rel="' + name + '"]').val(_.has(value, name) ? value[name] : '');
					
				});
				
				
			};
			
			_.bindModelToView(
				this.model,
				this,
				{
					expiredAt					: function ($control, value) {$control.val(value && (date = moment.utc(value)) && date.isValid() ? date.format('MM/DD/YYYY') : '');},
					userGroup					: null,
					product						: null,
					productDiscount				: discountValueDecoder,
					deliveryDiscount			: discountValueDecoder,
					insuranceDiscount			: discountValueDecoder,
					totalDiscount				: discountValueDecoder,
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			this.$el.valid();
			
			if (_.contains(this.model.get('condition') || [], PRODUCT_DISCOUNT_CONDITION_USER_GROUP_IN_LIST))
				this.$tabUserGroup.show();
			else
				this.$tabUserGroup.hide();
			
			if (_.contains(this.model.get('condition') || [], PRODUCT_DISCOUNT_CONDITION_PRODUCT_IN_LIST))
				this.$tabProduct.show();
			else
				this.$tabProduct.hide();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountForm.submit');
	
			var self = this;
			
			var discountValueEncoder = function ($control, value) {
				
				var value = {};
				
				_.each(['valueNumber', 'valuePercent', 'valuePercentMin', 'valuePercentMax'], function (name) {
					
					if (val = $control.filter('[rel="' + name + '"]').val())
						value[name] = Number(val);
						
				});
				
				return !_.isEmpty(value) ? value : undefined;
				
			};
			
			_.bindViewToModel(
				this.model,
				this,
				{
					expiredAt					: function ($control, value) {return (date = moment.utc(value)) && date.isValid() ? date.toDate() : undefined;},
					userGroup					: null,
					product						: null,
					productDiscount				: discountValueEncoder,
					deliveryDiscount			: discountValueEncoder,
					insuranceDiscount			: discountValueEncoder,
					totalDiscount				: discountValueEncoder,
					published					: function ($control, value) {return $control.prop('checked');}
				}
			);
			
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
						'Product Discount successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the product discount',
						error.message,
						false 
					);
					
				}
			
			);
	
			return false;
	
		},
		
		
		doChangeCondition : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductDiscountForm.doChangeCondition');
			
			var value = _.map(ev.val, function (val) {
				return Number(val);
			});
			
			console.log(value)
			
			if (_.contains(value, PRODUCT_DISCOUNT_CONDITION_USER_GROUP_IN_LIST))
				this.$tabUserGroup.show();
			else
				this.$tabUserGroup.hide();
			
			if (_.contains(value, PRODUCT_DISCOUNT_CONDITION_PRODUCT_IN_LIST))
				this.$tabProduct.show();
			else
				this.$tabProduct.hide();
			
		}
		
		
	});
	
	return view;

});