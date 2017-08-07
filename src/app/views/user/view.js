define([
    'underscore',
    'parse',
    
    'views/user/customer-profile/list',
    
    'text!templates/user/view.html'
], function (
	_, Parse,
	CustomerProfileList,
	viewTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserView.initialize');
	
			_.bindAll(this, 'render', 'fetch', 'build');
			
			this.control = {};
			
			this.template = _.template(viewTemplate);
			
			this.control.customerProfile = new CustomerProfileList({
				name		: 'customerProfile'
			});
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserView.render');
	
			this.$el.html(this.template());
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			return this;
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserView.fetch');
			
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
						'An error occurred while building user view',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserView.build');
			
			this.model = model;
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				null,
				{
					attribute	: 'data-name',
					method		: 'html',
					defaultValue: '&mdash;'
				}
			);
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		}
		
		
	});
	
	return view;

});