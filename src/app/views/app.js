define([
	'jquery',
	'underscore',
	'parse',
	'noty',
	
	'text!templates/app.html',
	'text!templates/app/menu.html',
	'text!templates/app/header.html',
	'text!templates/app/footer.html',
	'text!templates/app/403.html',
	'text!templates/app/breadcrumb.html',
	'text!templates/app/noty.html',
	
	'bootstrap',
	'jquery.cookies',
	'mCustomScrollbar'
], function (
	$, _, Parse, noty,
	appTemplate, appMenuTemplate, appHeaderTemplate, appFooterTemplate, app403Template, appBreadcrumbTemplate, appNotyTemplate
) {
	
	var BreadcrumbModel = Parse.Object.extend('', {
		
		_defaults: {
			href		: '',
			route		: '',
			params		: {},
			text		: '',
			title		: ''
		}
		
	});
	
	var BreadcrumbCollection = Parse.Collection.extend({
		
		model : BreadcrumbModel
	
	});
	
	var view = Parse.View.extend({
		
		el : 'body',
		
		breadcrumb : null,
		route : null,

	
		initialize : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppView.initialize');
			
			_.bindAll(this, 'render', 'renderHeader', 'renderFooter', 'renderBreadcrumb', 'render403', 'alert', 'prompt');
			
			this.breadcrumb = null;
			
			this.template = _.template(appTemplate);
			this.templateMenu = _.template(appMenuTemplate);
			this.templateHeader = _.template(appHeaderTemplate);
			this.templateFooter = _.template(appFooterTemplate);
			this.template403 = _.template(app403Template);
			this.templateBreadcrumb = _.template(appBreadcrumbTemplate);
			this.templateNoty = _.template(appNotyTemplate);
			
			this.breadcrumb = new BreadcrumbCollection;
			this.breadcrumb.bind('add', this.renderBreadcrumb);
			this.breadcrumb.bind('reset', this.renderBreadcrumb);
			
		},
	
	
		render : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppView.render');
			
			var self = this;
			
			this.$el.removeClass('account boxed separate-inputs').addClass('fixed-sidebar fixed-topbar theme-sdtl color-default').attr('data-page', '').html(this.template());
			
			this.$mainmenu = this.$('[role="mainmenu"]');
			this.$header = this.$('[role="header"]');
			this.$footer = this.$('[role="footer"]');
			this.$breadcrumb = this.$('[role="breadcrumb"]');
			this.$title = this.$('[role="page-title"]');
			this.$noty = this.$('[role="notification"]');
			
			this.$view = this.$('#body');
			
			this.$body = $('body');
			this.$logopanel = this.$('.logopanel');
			this.$topbar = this.$('.topbar');
			this.$sidebar = this.$('.sidebar');
			this.$sidebarInner = this.$('.sidebar-inner');
			this.$sidebarFooter = this.$('.sidebar-footer');
			
			this.renderMenu();
			this.renderHeader();
			this.renderFooter();
			
			this.$el.on('dragover', function (ev) {
				ev.stopPropagation();
				ev.preventDefault();
				return false;
			});
			
			this.$el.on('drop', function (ev) {
				ev.stopPropagation();
				ev.preventDefault();
				return false;
			});
			
			this.handleboxedLayout();
		
		    $('[data-toggle]').on('click', function(event) {
		        event.preventDefault();
		        var toggleLayout = $(this).data('toggle');
		        if (toggleLayout == 'sidebar-collapsed') self.collapsedSidebar();
		    });
		    
		    $(window).resize(function() {
			    setTimeout(function() {
			        self.handleboxedLayout();
			    }, 100);
			});
			
			$.fn.modal.Constructor.prototype.enforceFocus = function() {
				modal_this = this;
				$(document).on('focusin.modal', function (e) {
					if (
						modal_this.$element[0] !== e.target && !modal_this.$element.has(e.target).length 
						&& !$(e.target.parentNode).hasClass('cke_dialog_ui_input_select') 
						&& !$(e.target.parentNode).hasClass('cke_dialog_ui_input_text')
					) {
						modal_this.$element.focus()
					}
				})
			};
			
		},
		
		
		renderMenu : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppView.renderMenu');
			
			this.destroySideScroll();
			
			this.$mainmenu.html(this.templateMenu());
			
			this.createSideScroll();
			
		},
		
		
		renderHeader : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppView.renderHeader');
			
			this.$header.html(this.templateHeader());
			
		},
		
		
		renderFooter : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppView.renderFooter');
			
			this.$footer.html(this.templateFooter());
			
		},

		
		renderBreadcrumb : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppView.renderBreadcrumb');
			
			this.$breadcrumb.html('');
			this.$title.html('');
			
			if (this.breadcrumb.length > 0) {
				
				this.$title.show();
				
				if (this.breadcrumb.length > 1)
					this.$breadcrumb.show();
					
			} else {
				this.$breadcrumb.hide();
				this.$title.hide();
			}
			
			this.breadcrumb.each(function(model, index, list) {
				
				var item = model.toObject();

				if (index < _.size(list) - 1) {
					item.index = index;
					this.$breadcrumb.append(this.templateBreadcrumb(item));
				} else
					this.$title.html('<strong>' + item.title + '</strong>');
				
			}, this);
			
			
			
		},
		
		
		render403 : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppView.render403');
			
			this.$view.html(this.template403());
			
		},
		
		
		alert : function (container, type, title, text, timeout) {
			
			var n = (container || this.$noty).noty({
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
			
		},
		
		
		prompt : function (container, type, title, text, buttons, callback, data) {
	
			var n = (container || this.$noty).noty({
				text : this.templateNoty({type: type, title: title, text: text, prompt: true}),
				layout : 'top',
				theme : 'made',
				maxVisible : 10,
				animation : {
					open : 'animated fadeIn',
					close : 'animated fadeOut'
				},
				timeout: false,
				closeWith: ['button'],
				buttons: _.mapObject(
					buttons,
					function (button, result) {
						return {
							addClass: 'btn btn-' + button[0],
							text: button[1],
							onClick: function ($noty) {
								$noty.close();
								(button[2] ? button[2] : callback)(result, data);
							}
						};
					}
				)
			});
			
			return n;
			
		},
		
		
		updateMenu : function (route) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('AppView.updateMenu');
			
			this.renderMenu();
			
			if (route) {
				this.$mainmenu.find('li[rel="' + route + '"]').addClass('active');
				this.$mainmenu.find('li[rel="' + route + '"]').parents('li').addClass('active opened');
			}
			
		},
		
		
			/* ==========================================================*/
		/* LAYOUTS API                                                */
		/* ========================================================= */
		
		handleboxedLayout : function () {
			
		    this.$logopanel.css('left', '').css('right', '');
		    this.$topbar.css('width', '');
		    this.$sidebar.css('margin-left', '').css('margin-right', '');
		    this.$sidebarFooter.css('left', '').css('right', '');

		},
		
		
		collapsedSidebar : function () {
			
		    if (this.$body.css('position') != 'relative') {
		        if (!this.$body.hasClass('sidebar-collapsed')) this.createCollapsedSidebar();
		        else this.removeCollapsedSidebar();
		    } else {
		        if (this.$body.hasClass('sidebar-show')) this.$body.removeClass('sidebar-show');
		        else this.$body.addClass('sidebar-show');
		    }
		    this.handleboxedLayout();
		},
		
		createCollapsedSidebar : function () {
			
		    this.$body.addClass('sidebar-collapsed');
		    $('.sidebar').css('width', '').resizable().resizable('destroy');
		    $('.nav-sidebar ul').attr('style', '');
		    $(this).addClass('menu-collapsed');
		    this.destroySideScroll();
		    $('#switch-sidebar').prop('checked');
		    $.cookie('sidebar-collapsed', 1);
		},
		
		
		removeCollapsedSidebar : function () {
			
		    this.$body.removeClass('sidebar-collapsed');
		    if (!this.$body.hasClass('submenu-hover')) $('.nav-sidebar li.active ul').css({
		        display: 'block'
		    });
		    $(this).removeClass('menu-collapsed');
		    if (this.$body.hasClass('sidebar-light') && !this.$body.hasClass('sidebar-fixed')) {
		        $('.sidebar').height('');
		    }
		    this.createSideScroll();
		    $.removeCookie('sidebar-collapsed');
		},
		

		createSideScroll : function () {
			
			if ($.fn.mCustomScrollbar) {
				
				this.destroySideScroll();
				
				if (!this.$body.hasClass('sidebar-collapsed') && !this.$body.hasClass('sidebar-collapsed') && !this.$body.hasClass('submenu-hover') && this.$body.hasClass('fixed-sidebar')) {
					
					this.$sidebarInner.mCustomScrollbar({
						scrollButtons: {
							enable: false
						},
						autoHideScrollbar: true,
						scrollInertia: 150,
						theme: 'light-thin',
						advanced: {
							updateOnContentResize: true
						}
					});
				
				}
			}
			
		},
		
		destroySideScroll : function () {

			if ($.fn.mCustomScrollbar)
				this.$sidebarInner.mCustomScrollbar('destroy');

		}
		
		/******************** END LAYOUT API  ************************/
		/* ========================================================= */
		
		
	});
	
	return view;

});