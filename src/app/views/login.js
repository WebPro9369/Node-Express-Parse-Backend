define([
    'jquery',
    'underscore',
    'parse',
    'noty',
    
    'text!templates/login.html',
    'text!templates/app/noty.html',
    
    'jquery-validation'
], function(
	$, _, Parse, noty,
	loginTemplate, appNotyTemplate
) {

	var view = Parse.View.extend({
	
		el : 'body',
		
		initialize : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('LoginView.initialize');
	
			_.bindAll(this, 'render', 'submit');
	
			this.template = _.template(loginTemplate);
			this.templateNoty = _.template(appNotyTemplate);
	
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('LoginView.render');
	
			this.$el.removeClass('').addClass('account boxed separate-inputs').html(this.template()).attr('data-page', 'login');
	
			this.$form = this.$('form[role="form"]');
			
			this.$form.validate({
				errorElement: 'label',
				errorClass: 'error',
				validClass: 'success',
				rules : {
					username : {
						required : true
					},
					password : {
						required : true
					}
				},
				submitHandler : this.submit
			});
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('LoginView.submit');
	
			var self = this;
			
			var values = $(form).serializeArray();
			values = _.object(_.pluck(values, 'name'), _.pluck(values, 'value'));
			
			Parse.User.logIn(values.username, values.password).then(
				
				function(success) {
					
					app.router.navigate(app.router._generate('dashboardView'), true);
					
				},
				function(error) {
					
					self.alert(
						'danger',
						'An error occurred during log in',
						error.message,
						false 
					);
					
					Parse.User.logOut();
					
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