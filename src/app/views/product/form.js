define([
	'underscore',
	'parse',
	
	'classes/brand/collection',
	'classes/brand/model',
	
	'classes/stylist/collection',
	'classes/stylist/model',
	
	'classes/product/model',
	
	'views/image/list',
	'views/product/size/list',
	'views/product/order/list',
	
	'controls/form/dictionary',
	'controls/form/enum',
	
	'text!templates/product/form.html',
	
	'jquery-validation',
	'jquery-validation.defaults',
	'select2',
	'icheck'
], function (
	_, Parse,
	BrandCollection, BrandModel,
	StylistCollection, StylistModel,
	ProductModel,
	ImageList, ProductSizeList, ProductOrderList,
	DictionaryFormControl, EnumFormControl,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit');
			
			this.control = {};
	
			this.template = _.template(formTemplate);
			
			this.control.brand = new DictionaryFormControl({
				name		: 'brand',
				Collection	: BrandCollection,
				Model		: BrandModel,
				nullable	: true,
				beforeFetch	: function (query) {
					query.notEqualTo('hidden', true);
					query.ascending('name');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
			this.control.stylist = new DictionaryFormControl({
				name		: 'stylist',
				Collection	: StylistCollection,
				Model		: StylistModel,
				nullable	: true,
				beforeFetch	: function (query) {
					query.notEqualTo('hidden', true);
					query.equalTo('published', true);
					query.ascending('fullName');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
			this.control.pdpLookType = new EnumFormControl({
				name		: 'pdpLookType',
				datasource	: ProductModel.prototype.pdpLookTypeEnum,
				nullable	: true
			});
			
			this.control.category = new EnumFormControl({
				name		: 'category',
				datasource	: ProductModel.prototype.categoryEnum,
				nullable	: true,
				beforeSync	: function (control, model) {
					
					if (model.has('category1') && model.has('category2')) {
						
						var item1 = _.findWhere(control.datasource, {text: model.get('category1')});
						
						if (item1 && _.has(item1, 'children')) {
							
							var item2 = _.findWhere(item1.children, {text: model.get('category2')});
							
							return item2 ? item2.id : null;
							
						} else
							return null;
						
					} else if (model.has('category1')) {
						
						var item1 = _.findWhere(control.datasource, {text: model.get('category1')});
						
						return item1 ? item1.id : null;
						
					} else
						return null;
					
				},
				beforeApply	: function (control, model, value) {
					
					var
						after = {
							category1	: undefined,
							category2	: undefined
						};
					
					if (!_.isNull(value)) {
						
						if (item1 = _.findWhere(control.datasource, {id: value}))
							after.category1 = item1.text;
							
						else
							_.each(control.datasource, function (item1) {
								
								if (_.has(item1, 'children')) {
									
									if (item2 = _.findWhere(item1.children, {id: value})) {
										
										after.category1 = item1.text;
										after.category2 = item2.text;
										
									}
									
								}
								
							});
						
					}
					
					_.each(after, function (value, name) {
						
						if (value) {
							
							if (!this.has(name) || this.get(name) !== value)
								this.set(name, value);
							
						} else if (this.has(name))
							this.unset(name);
						
					}, model);
					
				}
			});
			
			this.control.photos = new ImageList({
				name		: 'photos',
				type		: 'form',
				limit		: 10,
				multiple	: true,
				sortable	: true,
				variants	: {
					binary2x		: {type: 'image/jpeg', size: {width: 400, height: 600, fill: true}, quality: 0.8},
					binary3x		: {type: 'image/jpeg', size: {width: 600, height: 900, fill: true}, quality: 0.8},
					webThumb1x		: {type: 'image/jpeg', size: {width: 72, height: 106, fill: true, crop: 0.5}, quality: 0.5},
					webThumb2x		: {type: 'image/jpeg', size: {width: 144, height: 212, fill: true, crop: 0.5}, quality: 0.5},
					web1x			: {type: 'image/jpeg', size: {width: 430, height: 645, fill: true, crop: 0.5}, quality: 0.5},
					web2x			: {type: 'image/jpeg', size: {width: 860, height: 1290, fill: true, crop: 0.5}, quality: 0.5}
				}
			});
			
			this.control.preview = new ImageList({
				name		: 'preview',
				type		: 'form',
				variants	: {
					binary2x		: {type: 'image/jpeg', size: {width: 400, height: 600, fill: true}, quality: 0.8},
					binary3x		: {type: 'image/jpeg', size: {width: 600, height: 900, fill: true}, quality: 0.8},
					web1x			: {type: 'image/jpeg', size: {width: 255, height: 383, fill: true, crop: 0.5}, quality: 0.5},
					web2x			: {type: 'image/jpeg', size: {width: 510, height: 766, fill: true, crop: 0.5}, quality: 0.5}
				}
			});
			
			
			this.control.sizes = new ProductSizeList({
				name		: 'sizes',
				type		: 'form',
				limit		: 25,
				multiple	: true,
				sortable	: true
			});
			
			
			this.control.order = new ProductOrderList({
				name		: 'order'
			});
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductForm.fetch');
			
			var promises = [];
			
			_.each(this.control, function (control, name) {
				
				if (name !== 'order')
					promises.push(control.fetch());
				
			});
			
			return Parse.Promise.when(promises).then(

				null,
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while building product form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			this.$tabAvailability = this.$('[href="#product-form-availability"]').parent();
			
			_.each(this.control, function (control, name) {
				
				control.setElement(this.$('[name="' + name + '"]'));
				
				if (_.isFunction(control.render))
					control.render();
					
			}, this);
			
			this.$el.validate({
				rules : {
					name : {
						required : true
					}
				},
				submitHandler : this.submit
			});
			
			this.$('[name="hidden"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			this.$('[name="published"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Product</strong> ' + (this.model.isNew() ? ' create' : 'update' + '<span class="pull-right">' + this.model.id + '</span>'));
			
			_.each(this.control, function (control, name) {
				
				if (name !== 'order' || !model.isNew())
					control.assign(model);
				
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					photos						: null,
					sizes						: null,
					hidden						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			this.$el.valid();
			
			if (this.model.isNew())
				this.$tabAvailability.hide();
			else
				this.$tabAvailability.show();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					photos						: null,
					sizes						: null,
					hidden						: function ($control, value) {return $control.prop('checked');},
					published					: function ($control, value) {return $control.prop('checked');}
				}
			);
			
			var promises = [];
			
			_.each(this.control, function (control, name) {
				
				if (name !== 'sizes' && name !== 'order')
					promises.push(control.apply());
					
			});
			
			if (this.model.isNew()) {
			
				promises.push(
					Parse.Cloud.run('nextSortOrder', {className: this.model.className}).then(
						
						function (nextSortOrder) {
							
							if (_.isNumber(nextSortOrder))
								self.model.set('sortOrder', nextSortOrder);
							
							return Parse.Promise.as();
							
						}
						
					)
				);
				
			}
			
			Parse.Promise.when(promises).then(
				
				function () {
					
			 		return self.model.save();
			 		
				}
				
			).then(
				
				function (result) {
					
					self.control.sizes.apply();
					self.model.set('quantity', self.control.sizes.total());
					self.model.set('sizeRangeUS', self.control.sizes.rangeUS());
					
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
						'Product successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the product',
						error.message,
						false 
					);
					
				}
			
			);
	
			return false;
	
		}
		
		
	});
	
	return view;

});