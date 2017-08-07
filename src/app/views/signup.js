define([
    'jquery',
    'underscore',
    'parse',
    'noty',
    
    'text!templates/signup.html',
    'text!templates/app/noty.html',
    
    'jquery-validation'
], function(
	$, _, Parse, noty,
	signupTemplate, appNotyTemplate
) {

	var view = Parse.View.extend({
	
		el : 'body',
		
		initialize : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SignupView.initialize');
	
			_.bindAll(this, 'render', 'submit');
	
			this.template = _.template(signupTemplate);
			this.templateNoty = _.template(appNotyTemplate);
	
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SignupView.render');
	
			this.$el.removeClass('').addClass('account boxed separate-inputs').html(this.template()).attr('data-page', 'signup');
	
			this.$form = this.$('form[role="form"]');
			
			this.$form.validate({
				errorElement: 'label',
				errorClass: 'error',
				validClass: 'success',
				rules : {
					fullName : {
						required : true
					},
					username : {
						required : true
					},
					password : {
						required : true
					},
					repeat: {
						required : true,
						equalTo: '#password'
					},
					phoneNumber : {
						required : true
					}
				},
				submitHandler : this.submit
			});
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SignupView.submit');
	
			var self = this;
			
			var values = $(form).serializeArray();
			values = _.object(_.pluck(values, 'name'), _.pluck(values, 'value'));
			
			var user = new Parse.User();
			user.set('fullName', values.fullName);
			user.set('username', values.username);
			user.set('email', values.username);
			user.set('password', values.password);
			user.set('phoneNumber', values.phoneNumber);
	
			user.signUp().then(
				
				function(success) {
					
					app.router.navigate(app.router._generate('dashboardView'), true);
					
				},
				function(error) {
					
					self.alert(
						'danger',
						'An error occurred during sign up',
						error.message,
						false 
					);
					
				}
				
			);
	
			return false;
		},
		
		
		alert : function (type, title, text, timeout) {
			
			var n = this.$('#login-block').noty({
				text : this.templateNoty({type: type, title: title, text: text, prompt: false}),
				layout : 'top',
				theme : 'made',
				maxVisible : 10,
				animation : {
					open : 'animated fadeIn',
					close : 'animated fadeOut'
				},
				timeout: timeout
			});
			
			return n;
			
		}
		
		
	});

	return view;

});