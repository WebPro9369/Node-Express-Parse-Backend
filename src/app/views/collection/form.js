define([
    'underscore',
    'parse',
    
    'classes/product/collection',
	'classes/product/model',
    
    'views/image/list',
    
    'controls/form/dictionary',
    'controls/form/array',
    
    'text!templates/collection/form.html',
    'text!templates/collection/product-gallery/list.html',
    'text!templates/collection/product-gallery/item.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
    'select2',
    'icheck'
], function (
	_, Parse,
	ProductCollection, ProductModel,
	ImageList,
	DictionaryFormControl, ArrayFormControl,
	formTemplate, productListTemplate, productItemTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {
			'change [name="name"]' : 'doChangePageUri'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit', 'doChangePageUri');
			
			this.control = {};
	
			this.template = _.template(formTemplate);
			
			this.control.product = new ArrayFormControl({
				name		: 'product',
				Collection	: ProductCollection,
				Model		: ProductModel,
				listTemplate: productListTemplate,
				itemTemplate: productItemTemplate,
				beforeFetch	: function (query) {
					query.select(['name', 'preview', 'price', 'quantity', 'published']);
					query.include(['preview']);
					query.notEqualTo('hidden', true);
					query.ascending('name');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
			this.control.preview = new ImageList({
				name		: 'preview',
				type		: 'form',
				variants	: {
					binary2x		: {type: 'image/jpeg', size: {width: 640, height: 1136, fill: true}, quality: 0.8},
					binary2x667h	: {type: 'image/jpeg', size: {width: 750, height: 1334, fill: true}, quality: 0.8},
					binary3x		: {type: 'image/jpeg', size: {width: 1242, height: 2208, fill: true}, quality: 0.8},
					web1x			: {type: 'image/jpeg', size: {width: 415, height: 600, fill: true, crop: 0.5}, quality: 0.5},
					web2x			: {type: 'image/jpeg', size: {width: 830, height: 1200, fill: true, crop: 0.5}, quality: 0.5}
				}
			});
			
			this.control.cover = new ImageList({
				name		: 'cover',
				type		: 'form',
				variants	: {
					web1x			: {type: 'image/jpeg', size: {width: 1030, height: 515, fill: true, crop: 0.5}, quality: 0.5},
					web2x			: {type: 'image/jpeg', size: {width: 2060, height: 1030, fill: true, crop: 0.5}, quality: 0.5}
				}
			});
			
		},

		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionForm.fetch');
			
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
		
		
		prebuild : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionForm.prebuild');
			
			var self = this;
			
			Parse.Promise.as().then(
				
				function () {
					
					if (model.isNew())
						return Parse.Promise.as(model);
						
					var query = new Parse.Query(model.className);
					query.include(['product', 'product.preview', 'preview', 'cover']);
					//query.include(['detailImage', 'specImage', 'image', 'unit', 'unit.value', 'unit.value.type']);
					return query.get(model.id);
					
				}
				
			).then(
				
				function (result) {
					
					self.build(result);
					
				},
				function (error) {
					
					app.view.alert(
						null,
						'danger',
						'An error occurred while building collection form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionForm.render');
	
			this.$el.html(this.template());
			
			this.$name = this.$('[name="name"]');
			this.$pageUri = this.$('[name="pageUri"]');
			this.$alertContainer = this.$('.modal-body');
			
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
			
			this.$('[name="private"]').iCheck({checkboxClass: 'icheckbox_flat'});
			this.$('[name="hidden"]').iCheck({checkboxClass: 'icheckbox_flat'});
			this.$('[name="published"]').iCheck({checkboxClass: 'icheckbox_flat'});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Collection</strong> ' + (this.model.isNew() ? ' create' : 'update' + '<span class="pull-right">' + this.model.id + '</span>'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					product						: null,
					notificatedAt				: function ($control, value) {$control.html(value ? 'Push notification sent at ' + moment(value).format(DATETIME_FORMAT) : 'If you publish an item, then all users will receive a push notification message about a new content unless private flag is checked.<br/>Therefore, completely fill out the information, verify it, and only then publish them.')},
					private						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					hidden						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			this.$el.valid();
			
			this.doChangePageUri();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					product						: null,
					notificatedAt				: null,
					private						: function ($control, value) {return $control.prop('checked');},
					hidden						: function ($control, value) {return $control.prop('checked');},
					published					: function ($control, value) {return $control.prop('checked');}
				}
			);
			
			var promises = [];
			
			_.each(this.control, function (control, name) {
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
					
					self.$('.modal').modal('hide');
					
					self.collection.fetch();
					
					app.view.alert(
						null,
						'success',
						'',
						'Collection successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the collection',
						error.message,
						false 
					);
					
				}
			
			);
	
			return false;
	
		},
		
		
		doChangePageUri : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CollectionForm.doChangePageUri');
			
			this.$pageUri.html(this.encodeUri(this.$name.val()));
			
			return false;
		
		},
		
		
		encodeUri : function (value) {
				
			var result = String(value || '');
			
			result = result.replace(/[^A-Za-z0-9\-]+/g, '-').replace(/\-+/, '-').replace(/^\-+/, '').replace(/\-+$/, '').toLowerCase();
			
			return !_.isEmpty(result) ? 'https://armarium.com/collections/' + result : '&nbsp;';
			
		}
		
	});
	
	return view;

});