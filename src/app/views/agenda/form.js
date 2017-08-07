define([
    'underscore',
    'parse',
    'svg',
    
    'classes/agenda/model',
    
    'views/image/list',
    
    'text!templates/agenda/form.html',
    'text!templates/agenda/svg/save-venice.svg',
    'text!templates/agenda/svg/night-moves.svg',
    'text!templates/agenda/svg/favorite-look.svg',
    
    'jquery-validation',
    'jquery-validation.defaults',
	'icheck',
	//'summernote'
	'cke-editor',
	'cke-editor.adapters'
], function (
	_, Parse, SVG,
	AgendaModel,
	ImageList,
	formTemplate, svgSaveVenice, svgNightMoves, svgFavoriteLook
) {
	
	var themeOptions = {
		
		// Save Venice
		1: {
			bannerImage		: 1,
			gridImage		: 6,
			gridBottomImage	: 2,
			browseImage		: 4
		},
		
		// Night Moves
		2: {
			bannerImage		: 50,
			gridImage		: false,
			gridBottomImage	: false,
			browseImage		: 4
		},
		
		// Favorite Look
		3: {
			bannerImage		: 1,
			gridImage		: 1,
			gridBottomImage	: false,
			browseImage		: false
		},
		
	};
	
	var themeSvg = {
		1	: svgSaveVenice,
		2	: svgNightMoves,
		3	: svgFavoriteLook
	};
	
	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit', 'buildThemePopover');
			
			this.control = {};
			this.theme = 0;
			
			this.template = _.template(formTemplate);
			
			this.control.thumbImage = new ImageList({
				name		: 'thumbImage',
				type		: 'form',
				limit		: 1
			});
			
			this.control.listImage = new ImageList({
				name		: 'listImage',
				type		: 'form',
				variants	: {
					web1x		: {type: 'image/jpeg', size: {width: 500, height: 300, fill: true, crop: 0.5}, quality: 0.5},
					web2x		: {type: 'image/jpeg', size: {width: 1000, height: 600, fill: true, crop: 0.5}, quality: 0.5}
				},
				limit		: 1
			});
			
			this.control.coverImage = new ImageList({
				name		: 'coverImage',
				type		: 'form',
				variants	: {
					web1x		: {type: 'image/jpeg', size: {width: 1024, height: 600, fill: true, crop: 0.5}, quality: 0.5},
					web2x		: {type: 'image/jpeg', size: {width: 2048, height: 1200, fill: true, crop: 0.5}, quality: 0.5}
				},
				limit		: 1
			});
			
			this.control.bannerImage = new ImageList({
				name		: 'bannerImage',
				type		: 'form',
				limit		: 10,
				multiple	: true,
				sortable	: true
			});
			
			this.control.gridImage = new ImageList({
				name		: 'gridImage',
				type		: 'form',
				limit		: 6,
				multiple	: true,
				sortable	: true
			});
			
			this.control.gridBottomImage = new ImageList({
				name		: 'gridBottomImage',
				type		: 'form',
				limit		: 2,
				multiple	: true,
				sortable	: true
			});
			
			this.control.browseImage = new ImageList({
				name		: 'browseImage',
				type		: 'form',
				limit		: 4,
				multiple	: true,
				sortable	: true
			});
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaForm.fetch');
			
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
						'An error occurred while building agenda form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			_.each(this.control, function (control, name) {
				control.setElement(this.$('[name="' + name + '"]'));
				if (_.isFunction(control.render))
					control.render();
			}, this);
			
			this.$el.validate({
				rules : {
					title : {
						required : true
					}
				},
				submitHandler	: this.submit
			});
			
			this.$('[name="inSlider"]').iCheck({
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
			
			this.$('[name="text"]').ckeditor();
			CKEDITOR.disableAutoInline = true;
			
			this.$('[data-toggle="popover"]').popover({
				placement	: 'auto left',
				html		: true,
				trigger		: 'hover',
				container	: this.$('.modal-body'),
				viewport	: this.$('.modal-body'),
				content 	: this.buildThemePopover
			});
			this.$('[data-toggle="popover"]').on('shown.bs.popover', this.highlightThemePopover);
			
			return this;
			
		},
		
		
		build : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaForm.build');
			
			this.model = model;
			
			this.$('.modal-title').html('<strong>Agenda</strong> ' + (this.model.isNew() ? ' create' : 'update'));
			
			this.theme = this.model.get('theme') || 1;
			
			var themeOption = themeOptions[this.theme];
			
			_.each(this.control, function (control, name) {
				
				if (themeOption && _.has(themeOption, name)) {
					
					control.enable();
					
					if (_.isNumber(themeOption[name]))
						control.assign(model, {limit: themeOption[name]});
						
					else if (themeOption[name] === false) {
						
						control.assign(model);
						control.disable();
						
					}
					
					
				} else
					control.assign(model);
				
			});
			
			_.bindModelToView(
				this.model,
				this,
				{
					bannerImage					: null,
					gridImage					: null,
					gridBottomImage				: null,
					browseImage					: null,
					text						: function ($control, value) {$control.ckeditorGet().setData(value || '');},
					inSlider					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					primary						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					hidden						: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');},
					published					: function ($control, value) {$control.iCheck(value === true ? 'check' : 'uncheck');}
				}
			);
			
			this.$('[data-agenda-theme]').hide();
			this.$('[data-agenda-theme~="' + this.theme + '"]').show();
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AgendaForm.submit');
	
			var self = this;
			
			_.bindViewToModel(
				this.model,
				this,
				{
					bannerImage					: null,
					gridImage					: null,
					gridBottomImage				: null,
					browseImage					: null,
					text						: function ($control, value) {return $control.ckeditorGet().getData();},
					inSlider					: function ($control, value) {return $control.prop('checked');},
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
				
				function (result) {
					
					self.$('.modal').modal('hide');
					
					self.collection.fetch();
					
					app.view.alert(
						null,
						'success',
						'',
						'Agenda successfully ' + (result.existed() ? 'updated' : 'created'),
						3000
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while saving the agenda',
						error.message,
						false 
					);
					
				}
			
			);
	
			return false;
	
		},
		
		
		buildThemePopover : function (el) {
			
			var $drawing = $('<div>');

			var draw = SVG($drawing[0]).size(265, 420);
			draw.svg(themeSvg[this.theme]);
			
			return $drawing;
			
		},
		
		
		highlightThemePopover : function () {
			
			var
				$this = $(this),
				$target = $this.parent(),
				popover = $this.data("bs.popover"),
				$popover = popover.tip(),
				name = $this.data('themeName');
				
			$popover.find(name).css('fill', '#990000');
			
		}
		
		
	});
	
	return view;

});