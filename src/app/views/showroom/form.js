define([
    'underscore',
    'parse',
    
    'classes/showroom/model',
    
    'entities/address',
    
    'text!templates/showroom/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
    'icheck'
], function (
	_, Parse,
	ShowroomModel,
	AddressEntity,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit');
			
			this.template = _.template(formTemplate);
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomForm.fetch');
			
			return Parse.Promise.as();
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			this.$el.validate({
				rules : {
					name : {
						required : true
					}
				},
				submitHandler	: this.submit
			});
			
			this.$('[name="primary"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			this.$('[name="published"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Showroom</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			_.bindModelToView(
				this.model,
				this,
				{
					address						: function ($control, value) {
						
						var value = new AddressEntity(value);
						
						$control.filter('[rel="streetLines"]').val(value.has('streetLines') ? value.get('streetLines').join("\n") : '');
						$control.filter('[rel="city"]').val(value.get('city') || '');
						$control.filter('[rel="stateOrProvinceCode"]').val(value.get('stateOrProvinceCode') || '');
						$control.filter('[rel="postalCode"]').val(value.get('postalCode') || '');
						$control.filter('[rel="countryCode"]').val(value.get('countryCode') || '');
						
					},
					primary						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
					
				}
			);
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ShowroomForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					address						: function ($control, value) {
						
						var value = new AddressEntity();
						
						if (val = $control.filter('[rel="streetLines"]').val())
							value.set('streetLines', val.split(/\n/));
						
						if (val = $control.filter('[rel="city"]').val())
							value.set('city', val);
						
						if (val = $control.filter('[rel="stateOrProvinceCode"]').val())
							value.set('stateOrProvinceCode', val);
						
						if (val = $control.filter('[rel="postalCode"]').val())
							value.set('postalCode', val);
						
						if (val = $control.filter('[rel="countryCode"]').val())
							value.set('countryCode', val);
						
						return value.encode();
					
					},
					primary					: function ($control, value) {return $control.prop('checked');},
					published				: function ($control, value) {return $control.prop('checked');}
				}
			);
			
			Parse.Promise.as().then(
				
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
						'Showroom successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the showroom',
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