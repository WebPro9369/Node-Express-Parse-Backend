define([
    'underscore',
    'parse',
    
    'classes/user-group/collection',
	'classes/user-group/model',
    
    'classes/user/model',
    
    'controls/form/dictionary',
    
    'text!templates/user/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults'
], function (
	_, Parse,
	UserGroupCollection, UserGroupModel,
	UserModel,
	DictionaryFormControl, 
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.group = new DictionaryFormControl({
				name		: 'group',
				Collection	: UserGroupCollection,
				Model		: UserGroupModel,
				multiple	: true,
				nullable	: true,
				scalar		: true,
				beforeFetch	: function (query) {
					query.ascending('name');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserForm.fetch');
			
			var self = this;
			
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
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			this.$transactionValue = this.$('[name="transaction-value"]');
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
					'transaction-value'		: {
						number	: true
					}
				},
				submitHandler	: this.submit
			});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>User</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					balance						: function ($control, value, model) {$control.html(value > 0 ? numeral(value).format(MONEY_FORMAT) : '&mdash;');},
				}
			);
			
			this.$transactionValue.val('');
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserForm.submit');
	
			var self = this;
			
			var promises = [];
			
			if (value = Number(this.$transactionValue.val())) {
				
				var
					params = {
						user	: this.model.id,
						value	: value
					};
			
				promises.push(Parse.Cloud.run('transactionCreate', params));
				
			}
			
			var
				before = this.model.get('group') || [],
				after = this.control.group.value() || [];
			
			if (!_.isEqual(_.sortBy(before), _.sortBy(after))) {
			
				var
					params = {
						user	: this.model.id,
						group	: after
					};
			
				promises.push(Parse.Cloud.run('userGroupUpdate', params));
					
			}
			
			Parse.Promise.when(promises).then(
				
				function (result) {
					
					self.model.fetch();
					
					self.$('.modal').modal('hide');
					
					app.view.alert(
						self.$alertContainer,
						'success',
						'',
						'User changed',
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'Failed to change user',
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