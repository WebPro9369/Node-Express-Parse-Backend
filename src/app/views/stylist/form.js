define([
    'underscore',
    'parse',
    
    'classes/showroom/collection',
	'classes/showroom/model',
    
    'classes/stylist/model',
    
    'views/image/list',
    'views/stylist/availability/list',
    
    'controls/form/dictionary',
    'controls/form/enum',
    
    'text!templates/stylist/form.html',
    
    'jquery-validation',
    'jquery-validation.defaults',
    'icheck'
], function (
	_, Parse,
	ShowroomCollection, ShowroomModel,
	StylistModel,
	ImageList, StylistAvailabilityList,
	DictionaryFormControl, EnumFormControl,
	formTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {
			'change [name="type"]' : 'doChangeType'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit', 'doChangeType');
			
			this.control = {};
			
			this.template = _.template(formTemplate);
			
			this.control.type = new EnumFormControl({
				name		: 'type',
				datasource	: StylistModel.prototype.typeEnum,
				nullable	: true
			});
			
			this.control.gender = new EnumFormControl({
				name		: 'gender',
				datasource	: StylistModel.prototype.genderEnum,
				nullable	: true
			});
			
			this.control.showroom = new DictionaryFormControl({
				name		: 'showroom',
				Collection	: ShowroomCollection,
				Model		: ShowroomModel,
				nullable	: true,
				beforeFetch	: function (query) {
					query.ascending('name');
					query.limit(PAGINATION_LIMIT);
				}
			});
			
			this.control.photo = new ImageList({
				name		: 'photo',
				type		: 'form',
				variants	: {
					binary2x		: {type: 'image/jpeg', size: {width: 400, height: 600, fill: true}, quality: 0.8},
					binary3x		: {type: 'image/jpeg', size: {width: 600, height: 900, fill: true}, quality: 0.8},
					web1x			: {type: 'image/jpeg', size: {width: 258, height: 258, fill: true, crop: 0.5}, quality: 0.5},
					web2x			: {type: 'image/jpeg', size: {width: 516, height: 516, fill: true, crop: 0.5}, quality: 0.5}
				}
			});
			
			this.control.image = new ImageList({
				name		: 'image',
				type		: 'form',
				variants	: {
					binary2x		: {type: 'image/jpeg', size: {width: 750, height: 236, fill: true, crop: 0.5}, quality: 0.8},
					binary3x		: {type: 'image/jpeg', size: {width: 1242, height: 354, fill: true, crop: 0.5}, quality: 0.8}
				}
			});
			
			this.control.availability = new StylistAvailabilityList({
				type		: 'form'
			});

			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistForm.fetch');
			
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
						'An error occurred while building stylist form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistForm.render');
			
			var data = {
				socialTypes		: StylistModel.prototype.socialTypeEnum
			};
	
			this.$el.html(this.template(data));
			
			this.$alertContainer = this.$('.modal-body');
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
					name : {
						required	: true
					},
					price : {
						required	: true,
						number		: true
					}
				},
				submitHandler	: this.submit
			});
			
			this.$('[name="ableToTravel"]').iCheck({
				checkboxClass: 'icheckbox_flat'
			});
			
			this.$('[name="primary"]').iCheck({
				checkboxClass: 'icheckbox_flat'
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
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Stylist</strong> ' + (this.model.isNew() ? ' create' : 'update' + '<span class="pull-right">' + this.model.id + '</span>'));
			
			_.each(this.control, function (control, name) {
				control.assign(model);
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					location					: null,
					previousJob					: function ($control, value) {

						value = value || [];
						
						$control.filter('[rel="0"]').val(value[0] || '');
						$control.filter('[rel="1"]').val(value[1] || '');
						
					},
					socialLink					: function ($control, value) {

						value = value || [];
						
						_.each(StylistModel.prototype.socialTypeEnum, function (socialType) {
							
							var val = _.findWhere(value, {code: socialType.id});
							
							$control.filter('[rel="' + socialType.id + '"]').val(_.has(val, 'link') ? val.link : '');
							
						});
						
						
					},
					notificatedAt				: function ($control, value) {$control.html(value ? 'Push notification sent at ' + moment(value).format(DATETIME_FORMAT) : 'If you publish an item, then all users will receive a push notification message about a new content.<br/>Therefore, completely fill out the information, verify it, and only then publish them.')},
					ableToTravel				: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					primary						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					hidden						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			if (type = this.model.get('type')) {
				
				this.$('[data-stylist-type="' + type + '"]').show();
				this.$('[data-stylist-type][data-stylist-type!="' + type + '"]').hide();
				
			} else
				this.$('[data-stylist-type]').hide();
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					location					: null,
					previousJob					: function ($control, value) {
						
						var value = [];
						
						if (val = $control.filter('[rel="0"]').val())
							value.push(val);
						
						if (val = $control.filter('[rel="1"]').val())
							value.push(val);
						
						return !_.isEmpty(value) ? value : undefined;
					
					},
					socialLink					: function ($control, value) {
						
						var value = [];
						
						_.each(StylistModel.prototype.socialTypeEnum, function (socialType) {
							
							if (val = $control.filter('[rel="' + socialType.id + '"]').val())
								value.push({code: socialType.id, link: val});
								
						});
						
						return !_.isEmpty(value) ? value : undefined;
					
					},
					notificatedAt				: null,
					ableToTravel				: function ($control, value) {return $control.prop('checked');},
					primary						: function ($control, value) {return $control.prop('checked');},
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
				
				function () {
					
					return self.control.availability.apply(true).then(
						
						null,
						function () {
							return Parse.Promise.error(new Parse.Error(null, 'Timetable update failed'));
						}
						
					);
			 		
				}
				
			).then(
				
				function (result) {
					
					self.$('.modal').modal('hide');
					
					self.collection.fetch();
					
					app.view.alert(
						null,
						'success',
						'',
						'Stylist successfully ' + (self.model.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the stylist',
						error.message,
						false 
					);
					
				}
			
			);
	
			return false;
	
		},
		
		
		doChangeType : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('StylistForm.doChangeType');
			
			if (ev.val) {
				
				this.$('[data-stylist-type="' + ev.val + '"]').show();
				this.$('[data-stylist-type][data-stylist-type!="' + ev.val + '"]').hide();
				
			} else
				this.$('[data-stylist-type]').hide();
			
		}
		
		
	});
	
	return view;

});