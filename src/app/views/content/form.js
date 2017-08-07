define([
    'underscore',
    'parse',
    
    'classes/content/model',
    
    'controls/form/image',
    'controls/form/enum',
    
    'text!templates/content/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults'
], function (
	_, Parse,
	ContentModel,
	ImageFormControl, EnumFormControl,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.fileValue = new ImageFormControl({
				name		: 'fileValue',
				type		: true
			});
			
			this.control.node = new EnumFormControl({
				name		: 'node',
				datasource	: ContentModel.prototype.nodeEnum,
				nullable	: true
			});
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentForm.fetch');
			
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
						'An error occurred while building content form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
					node : {
						required : true
					},
					key : {
						required : true
					}
				},
				submitHandler	: this.submit
			});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Content</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this
			);
			
			if (type = this.model.get('type')) {
				
				this.$('[data-content-type="' + type + '"]').show();
				this.$('[data-content-type][data-content-type!="' + type + '"]').hide();
				
			} else
				this.$('[data-content-type]').show();
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ContentForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this
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
						'Content successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the content',
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