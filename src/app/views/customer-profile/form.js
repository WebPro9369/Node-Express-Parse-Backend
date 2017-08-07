define([
    'underscore',
    'parse',
    
    'classes/customer-profile/collection',
    'classes/customer-profile/model',
    
    'views/customer-profile/value/list',
    
    'controls/form/dictionary',
    'controls/form/enum',
    
    'text!templates/customer-profile/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
	'icheck'
], function (
	_, Parse,
	CustomerProfileCollection, CustomerProfileModel,
	CustomerProfileValueList,
	DictionaryFormControl, EnumFormControl,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {
			'change [name="type"]'	: 'doChangeType'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit', 'doChangeType');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.parent = new DictionaryFormControl({
				name		: 'parent',
				Collection	: CustomerProfileCollection,
				Model		: CustomerProfileModel,
				nullable	: true,
				beforeFetch	: function (query) {
					query.equalTo('isCategory', true);
					query.ascending('title');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
			this.control.type = new EnumFormControl({
				name		: 'type',
				datasource	: CustomerProfileModel.prototype.typeEnum,
				nullable	: true
			});
			
			this.control.values = new CustomerProfileValueList({
				name		: 'values',
				placeholder	: 'placeholders',
				valueType	: 'type',
				type		: 'form',
				limit		: 100,
				sortable	: true
			});
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileForm.fetch');
			
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
						'An error occurred while building customer profile form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
					key : {
						required : true
					},
					title : {
						required : true
					}
				},
				submitHandler	: this.submit
			});
			
			this.$('[name="multiple"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			this.$('[name="published"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Customer Profile Option</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					values						: null,
					multiple					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			if (this.model.get('isCategory') === true)
				this.$('[data-category="false"]').hide();
				
			else
				this.$('[data-category="false"]').show();
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					values						: null,
					multiple					: function ($control, value) {return $control.prop('checked');},
					published					: function ($control, value) {return $control.prop('checked');}
				}
			);
			
			var promises = [];
			
			_.each(this.control, function (control, name) {
				promises.push(control.apply());
			});
			
			if (this.model.isNew()) {
				
				var params = {className: this.model.className};
				
				if (this.model.has('parent') && (parent = this.model.get('parent')) && (parent instanceof Parse.Object)) {
					
					params.parentKey = 'parent';
					params.parentValue = parent._toPointer();
					 
				}
			
				promises.push(
					Parse.Cloud.run('nextSortOrder', params).then(
						
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
						'Customer Profile successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the customer profile',
						error.message,
						false 
					);
					
				}
			
			);
	
			return false;
	
		},
		
		
		doChangeType : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileForm.doChangeType');
			
			var
				$target = $(ev.currentTarget),
				value = $target.val();
			
			this.control.values.changeType(value);
			
			return false;
			
		}
		
		
	});
	
	return view;

});