define([
    'underscore',
    'parse',
    
    'classes/stylist-tutorial/model',
    
    'views/image/list',
    
    'text!templates/stylist-tutorial/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
    'icheck'
], function (
	_, Parse,
	StylistTutorialModel,
	ImageList,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.preview = new ImageList({
				name		: 'preview',
				type		: 'form',
				variants	: {
					binary2x		: {type: 'image/jpeg', size: {width: 640, height: 1136, fill: true}, quality: 0.8},
					binary2x667h	: {type: 'image/jpeg', size: {width: 750, height: 1334, fill: true}, quality: 0.8},
					binary3x		: {type: 'image/jpeg', size: {width: 1242, height: 2208, fill: true}, quality: 0.8}
				}
			});
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialForm.fetch');
			
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
						'An error occurred while building stylist tutorial form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
				},
				submitHandler	: this.submit
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Stylist tutorial</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					hidden						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistTutorialForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
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
						'Stylist tutorial successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the stylist tutorial',
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