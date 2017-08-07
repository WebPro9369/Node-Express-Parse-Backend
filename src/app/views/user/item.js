define([
    'underscore',
    'parse',
    
    'text!templates/user/item.html'
], function(
	_, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'tr',
	
		events : {
			'click [data-action="user-confirm"]'			: 'doConfirm',
			'click [data-action="user-group-change"]'		: 'doGroupChange'
		},
		
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserItem.initialize');
			
			_.bindAll(this, 'render', 'doConfirm', 'makeConfirm', 'doGroupChange');
			
			this.template = _.template(itemTemplate);
			
			this.model.bind('change', this.render);
			this.model.bind('change:confirmed', this.render);
			this.model.bind('change:group', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserItem.render');
			
			this.$el.html(this.template(this.model.toTemplate()));
			
			this.$el.attr('data-id', this.model.id);
			
			return this;
			
		},
		
		
		doConfirm : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserItem.doConfirm');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			app.view.prompt(
				null,
				'danger',
				'User confirmation',
				'Are you sure you want to confirm user &laquo;' + (this.model.get('username') || '') + '&raquo;?',
				{
					yes	: ['danger', 'Yes, I agree'],
					no	: ['primary', 'No, I do not agree']
				},
				this.makeConfirm,
				data
			);
			
			return false;
			
		},
		
		
		makeConfirm : function(result, data) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserItem.makeConfirm');
			
			var self = this;
			
			if (result === 'yes' && _.has(data, 'id') && _.has(data, 'value')) {
				
				Parse.Cloud.run('userConfirm', {user: data.id, value: data.value}).then(
					
					function (result) {
						
						self.model.fetch();
						
						app.view.alert(
							null,
							'success',
							'',
							'User confirmed',
							3000
						);
						
					},
					function (error) {
						
						app.view.alert(
							null,
							'danger',
							'Failed to confirm user',
							error.message,
							false
						);
						
					}
						
				);
				
			}
			
		},
		
		
		doGroupChange : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('UserItem.doGroupChange');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data(),
				params = {user: this.model.id};
			
			if (data && _.has(data, 'id') && _.has(data, 'value')) {
				
				if (data.value === true)
					params.groupToRemove = [data.id];
				
				else
					params.groupToAdd = [data.id];
				
				var self = this;
			
				Parse.Cloud.run('userGroupUpdate', params).then(
					
					function (result) {
						
						self.model.fetch();
						
						app.view.alert(
							null,
							'success',
							'',
							'User group changed',
							3000
						);
						
					},
					function (error) {
						
						app.view.alert(
							null,
							'danger',
							'Failed to change user group',
							error.message,
							false
						);
						
					}
						
				);
					
			}
			
			return false;
			
		}
		
		
	});
	
	return view;

});