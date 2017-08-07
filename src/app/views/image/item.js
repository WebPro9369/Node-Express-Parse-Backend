define([
    'underscore',
    'parse',
    
    'text!templates/image/item.html'
], function (
	_, Parse,
	itemTemplate
) {
	
	var view = Parse.View.extend({
	
		tagName : 'figure',
	
		events : {
			'click [data-action="image-remove"]'			: 'doRemove',
			'click [data-action="image-alignment"]'			: 'doAlignment'
		},
	
	
		initialize : function(options) {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.initialize');
			
			_.bindAll(this, 'render', 'doRemove', 'doAlignment', 'doChangeTitle', 'doShowTitle', 'doHideTitle', 'doChangeHref', 'doShowHref', 'doHideHref');
			
			this.template = _.template(itemTemplate);
			
			this.type = options.type === 'form' ? 'form' : 'view';
			
			this.model.bind('change', this.render);
	
		},
	
	
		render : function() {
			
			//if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.render');
			
			this.$el.html(this.template(this.model.toTemplate())).addClass('effect-zoe');
			
			this.$el.attr('data-id', this.model.cid);
			
			if (this.model.has('alignment'))
				this.$('[data-action="image-alignment"][data-value="' + this.model.get('alignment') + '"]').addClass('active');
			
			this.$('h2.title').editable({
				placement	: 'top',
				inputclass	: 'ignore',
				placeholder	: 'Enter image title',
				emptytext	: 'Title is not specified',
				success		: this.doChangeTitle
			});
			
			this.$('h2.title').on('shown', this.doShowTitle);
			this.$('h2.title').on('hidden', this.doHideTitle);
			
			this.$('h2.href').editable({
				placement	: 'top',
				inputclass	: 'ignore',
				placeholder	: 'Enter image URL',
				emptytext	: 'URL is not specified',
				success		: this.doChangeHref
			});
			
			this.$('h2.href').on('shown', this.doShowHref);
			this.$('h2.href').on('hidden', this.doHideHref);
			
			return this;
			
		},
		
		
		doRemove : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.doRemove');
			
			if (this.type === 'form') {
				this.model.collection.remove(this.model);
				this.remove();
			}
			
			return false;
			
		},
		
		
		doAlignment : function(ev) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.doAlignment');
			
			var
				$target = $(ev.currentTarget),
				data = $target.data();
			
			if (this.type === 'form') {
				
				var value = _.contains(['top', 'middle', 'bottom'], data.value) ? data.value : undefined;
				
				if (value && this.model.get('alignment') !== value)
					this.model.set('alignment', value);
				
				else if (!value && this.model.has('alignment'))
					this.model.unset('alignment');
				
				
			}
			
			return false;
			
		},
		
		
		doChangeTitle : function(response, value) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.doChangeTitle');
			
			if (this.type === 'form') {
				
				if (value && this.model.get('title') !== value)
					this.model.set('title', value);
				
				else if (!value && this.model.has('title'))
					this.model.unset('title');
				
			}
			
			return false;
			
		},
		
		doShowTitle : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.doShowTitle');
			
			this.$el.addClass('active');
			
		},
		
		doHideTitle : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.doHideTitle');
			
			this.$el.removeClass('active');
			
		},
		
		
		doChangeHref : function(response, value) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.doChangeHref');
			
			if (this.type === 'form') {
				
				if (value && this.model.get('href') !== value)
					this.model.set('href', value);
				
				else if (!value && this.model.has('href'))
					this.model.unset('href');
				
			}
			
			return false;
			
		},
		
		doShowHref : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.doShowHref');
			
			this.$el.addClass('active');
			
		},
		
		doHideHref : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageItem.doHideHref');
			
			this.$el.removeClass('active');
			
		}
		
		
	});

	return view;

});