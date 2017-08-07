define([
    'underscore',
    'parse',
    
    'classes/user-group/collection',
	'classes/user-group/model',
    
    'classes/system-event/model',
    
    'controls/form/dictionary',
    'controls/form/enum',
    
    'text!templates/system-event/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
	'icheck'
], function (
	_, Parse,
	UserGroupCollection, UserGroupModel,
	SystemEventModel,
	DictionaryFormControl, EnumFormControl,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {
			'change [name="type"]'			: 'doChangeType'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit', 'doChangeType');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.type = new EnumFormControl({
				name		: 'type',
				datasource	: SystemEventModel.prototype.typeEnum,
				nullable	: true
			});
			
			this.control.userGroupAdd1 = new DictionaryFormControl({
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
			
			this.control.userGroupAdd2 = new DictionaryFormControl({
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
			
			this.control.userGroupRemove2 = new DictionaryFormControl({
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventForm.fetch');
			
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
						'An error occurred while building system event form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			_.each(
				[
					'userBalance1',
					'userBalance2', 'userReferrerBalance2'
				],
				function (name) {
					this['$' + name] = this.$('[name="' + name + '"]');
				},
				this
			);
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
					type			: {
						required	: true,
						number		: true
					},
					userBalance1	: {
						number		: true
					},
					userBalance2	: {
						number		: true
					}
				},
				submitHandler	: this.submit
			});
			
			this.$('[name="published"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>System Event</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			_.each(this.control, function (control, name) {
				
				if (name !== 'type')
					return;
					
				control.assign(model);
				
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			var
				type = this.model.get('type') || 0,
				params = this.model.get('params') || {};
			
			if (type === SYSTEM_EVENT_TYPE_USER_SIGNED) {
				
				this.$userBalance1.val(params.userBalance || '');
				
				if (_.has(params, 'userGroupAdd') && !_.isEmpty(params.userGroupAdd))
					this.control.userGroupAdd1.set(params.userGroupAdd);
				else
					this.control.userGroupAdd1.unset();
				
				this.control.userGroupAdd1.sync(true);
				
				this.$userBalance2.val('');
				this.$userReferrerBalance2.val('');
				this.control.userGroupAdd2.sync();
				this.control.userGroupRemove2.sync();
				
			} else if (type === SYSTEM_EVENT_TYPE_PRODUCT_ORDER_CHARGED) {
				
				this.$userBalance2.val(params.userBalance || '');
				this.$userReferrerBalance2.val(params.userReferrerBalance || '');
				
				if (_.has(params, 'userGroupAdd') && !_.isEmpty(params.userGroupAdd))
					this.control.userGroupAdd2.set(params.userGroupAdd);
				else
					this.control.userGroupAdd2.unset();
				
				this.control.userGroupAdd2.sync(true);
					
				if (_.has(params, 'userGroupRemove') && !_.isEmpty(params.userGroupRemove))
					this.control.userGroupRemove2.set(params.userGroupRemove);
				else
					this.control.userGroupRemove2.unset();
				
				this.control.userGroupRemove2.sync(true);
				
				this.$userBalance1.val('');
				this.control.userGroupAdd1.sync();
				
			}
			
			this.$('[data-system-event-type]').hide();
			this.$('[data-system-event-type~="' + type + '"]').show();
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					published					: function ($control, value) {return $control.prop('checked');}
				}
			);
			
			var
				type = this.model.get('type') || 0,
				params = {};
			
			if (type === SYSTEM_EVENT_TYPE_USER_SIGNED) {
				
				if (val = Number(this.$userBalance1.val()))
					params.userBalance = val;
				
				if ((val = this.control.userGroupAdd1.value()) && !_.isEmpty(val))
					params.userGroupAdd = val;
				
			} else if (type === SYSTEM_EVENT_TYPE_PRODUCT_ORDER_CHARGED) {
				
				if (val = Number(this.$userBalance2.val()))
					params.userBalance = val;
				
				if (val = Number(this.$userReferrerBalance2.val()))
					params.userReferrerBalance = val;
				
				if ((val = this.control.userGroupAdd2.value()) && !_.isEmpty(val))
					params.userGroupAdd = val;
					
				if ((val = this.control.userGroupRemove2.value()) && !_.isEmpty(val))
					params.userGroupRemove = val;
				
			}
			
			if (!_.isEmpty(params))
				this.model.set('params', params);
			else if (this.model.has('params'))
				this.model.unset('params');
			
			var promises = [];
			
			_.each(this.control, function (control, name) {
				
				if (name !== 'type')
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
						'System Event successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the system event',
						error.message,
						false 
					);
					
				}
			
			);
	
			return false;
	
		},
		
		
		doChangeType : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('SystemEventForm.doChangeType');
			
			this.$('[data-system-event-type]').hide();
			this.$('[data-system-event-type~="' + (ev.val || 0) + '"]').show();
			
		}
		
		
	});
	
	return view;

});