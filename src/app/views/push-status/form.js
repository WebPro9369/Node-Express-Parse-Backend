define([
    'underscore',
    'parse',
    
    'classes/push-status/model',
    
    'text!templates/push-status/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults'
], function (
	_, Parse,
	PushStatusModel,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit');
			
			this.template = _.template(formTemplate);
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusForm.fetch');
			
			return Parse.Promise.as();
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusForm.render');
	
			this.$el.html(this.template());
			
			this.$message = this.$('[name="message"]');
			
			this.$alertContainer = this.$('.modal-body');
			
			this.$el.validate({
				rules : {
					message : {
						required : true
					}
				},
				submitHandler	: this.submit
			});
			
			return this;
			
		},
		
		
		build : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusForm.build');
			
			this.$message.val('');
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('PushStatusForm.submit');
	
			var self = this;
			
			var params = {
				message: this.$message.val()
			};
			
			Parse.Cloud.run('sendPushNotification', params).then(
				
				function(success) {
					
					self.$('.modal').modal('hide');
					
					app.view.alert(
						null,
						'success',
						'',
						'Notifications has been sent successfully.',
						3000
					);
					
					if (self.options.parentView)
						self.options.parentView.fetch();
					
					self.$('.modal').modal('hide');
					
				},
				function(error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while sending notification',
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