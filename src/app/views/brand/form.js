define([
    'underscore',
    'parse',
    
    'classes/brand/model',
    
    'views/image/list',
    
    'text!templates/brand/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
    'icheck'
], function (
	_, Parse,
	BrandModel,
	ImageList,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.image = new ImageList({
				name		: 'image',
				type		: 'form',
				variants	: {
					binary2x		: {type: 'image/jpeg', size: {width: 500, height: 250, fill: true}, quality: 0.8},
					web1x			: {type: 'image/jpeg', size: {width: 514, height: 308, fill: true, crop: 0.5}, quality: 0.5},
					web2x			: {type: 'image/jpeg', size: {width: 1028, height: 616, fill: true, crop: 0.5}, quality: 0.5}
				}
			});
			
			this.control.cover = new ImageList({
				name		: 'cover',
				type		: 'form'
			});
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandForm.fetch');
			
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
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandForm.render');
	
			this.$el.html(this.template());
			
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
				submitHandler	: this.submit
			});
			
			this.$('[name="inSlider"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			this.$('[name="primary"]').iCheck({
				checkboxClass: 'icheckbox_flat'
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Brand</strong> ' + (this.model.isNew() ? ' create' : 'update' + '<span class="pull-right">' + this.model.id + '</span>'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					inSlider					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					primary						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					hidden						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('BrandForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					inSlider					: function ($control, value) {return $control.prop('checked');},
					primary						: function ($control, value) {return $control.prop('checked');},
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
						'Brand successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the brand',
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