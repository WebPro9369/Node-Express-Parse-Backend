define([
    'jquery',
    'underscore',
    'parse',
    
    'classes/image/collection',
    'classes/image/model',
    
    'views/image/item',
    
    'controls/form/image-builder',
    
    'text!templates/image/list.html',
    
    'filedrop-iterate',
    'jquery-ui',
    'bootstrap-editable'
], function (
	$, _, Parse,
	ImageCollection, ImageModel,
	ImageItem,
	ImageBuilderControl,
	listTemplate
) {
	
	var view = Parse.View.extend({
	
		events : {},
		
		_disabled : null,
		
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.initialize');
	
			_.bindAll(this, 'disable', 'enable', 'assign', 'sync', 'render', 'fetch', 'addImageModel', 'removeImageModel', 'resetImageCollection', 'updateImageCollection', 'apply', 'onImageStart', 'onImageProgress', 'onImageRead', 'onImageFinish');
			
			this._disabled = false;
			
			this.template = _.template(listTemplate);
			
			if (options.name)
				this.name = options.name;
			
			this.limit = options.limit > 0 ? options.limit : 1;

			this.variants = _.defaults(options.variants || {}, {
				thumb		: {type: 'image/jpeg', size: {width: 250, height: 250, fill: true, crop: 0.5}, quality: 0.7},
				original	: true
			});
			
			this.type = options.type === 'form' ? 'form' : 'view';
			
			this.multiple = options.multiple === true;
			this.nullable = options.nullable === true;
			this.sortable = options.sortable === true;
			
			this.collection = new ImageCollection;
			this.collection.bind('add', this.addImageModel);
			this.collection.bind('remove', this.removeImageModel);
			this.collection.bind('reset', this.resetImageCollection);
			
			/*if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.bind('sync', this.sync);*/
			
		},
		
		
		disable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.disable ' + this.name);
	
			this._disabled = true;
			
		},
		
		
		enable : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.enable ' + this.name);
			
			this._disabled = false;
			
		},
		
		
		assign : function (model, options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.assign ' + this.name);
			
			/*if ((this.model instanceof Parse.Object) || (this.model instanceof Parse.User))
				this.model.unbind('sync', this.sync);
			
			if (!((model instanceof Parse.Object) || (model instanceof Parse.User)))
				throw 'model must be instance of Parse.Object';*/
			
			if (_.isObject(options)) {
				
				if (_.has(options, 'limit'))
					this.limit = options.limit;
				
				if (_.has(options, 'multiple'))
					this.multiple = options.multiple;
				
				if (_.has(options, 'nullable'))
					this.nullable = options.nullable;
				
				if (_.has(options, 'sortable'))
					this.sortable = options.sortable;
				
			}
			
			this.model = model;
			
			//this.model.bind('sync', this.sync);
			
			this.sync();
			
		},
		
		
		sync : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.sync ' + this.name);
			
			if (this.name && this.model.has(this.name)) {
				
				var value = this.model.get(this.name);
				
				this.collection.reset(_.isArray(value) ? value : [value]);
				
				
			} else
				this.collection.reset();
			
		},
		
		
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.render');
	
			this.$el.html(this.template());
			
			if (this._disabled)
				return;
			
			this.$items = this.$('[role="items"]');
			
			this.$imageDropzone = this.$('[role="dropzone"]');
			
			if (this.type === 'form') {
				
				var self = this;
				
				this.imageDropzone = this.$imageDropzone.fileDropIterate({
					clickable: true,
					onFileList: function (iterator) {
						
						iterator.onStart = self.onImageStart;
						iterator.onProgress = self.onImageProgress;
						iterator.onRead = self.onImageRead;
						iterator.onFinish = self.onImageFinish;
						
						iterator.start();
						
					}
				});
				
				if (this.sortable) {
					
					this.$items.sortable({
						items: "> [data-id]"
					});
		    		//this.$items.disableSelection();
		    		
		    	}
			
			}
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.fetch');
			
			return Parse.Promise.as();
			
		},
		
		
		addImageModel : function(model) {
			
			var view = new ImageItem({model : model, type : this.type});
			
			if (this.type === 'form')
				this.$imageDropzone.before(view.render().el);
			else
				this.$items.append(view.render().el);
			
			if (this.type === 'form')
				this.updateImageCollection();
			
		},
		
		
		removeImageModel : function(model) {
			
			if (this.type === 'form')
				this.updateImageCollection();
				
		},
	
	
		resetImageCollection : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.resetImageCollection');
	
			this.$items.find('> :not([role="dropzone"])').remove();
			this.collection.each(this.addImageModel);
			
			this.updateImageCollection();
			
		},
		
		
		updateImageCollection : function() {
			
			if ((this.type === 'form' && this.collection.length < this.limit) || (this.type !== 'form' && this.collection.length <= 0))
				this.$imageDropzone.show();
				
			else
				this.$imageDropzone.hide();
				
		},
		
		
		apply : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.apply ' + this.name);
			
			if (this._disabled)
				return Parse.Promise.as();
			
			if (this.name) {
				
				if (this.multiple) {
					
					var items = this.sortable ? this.collection.ordered(this.$items.sortable('toArray', {attribute: 'data-id'})) : this.collection.unordered();
					
					var before = _.map(this.model.get(this.name), function (item) {return item.id;});
					var after = _.map(items, function (item) {return item.id;});
					
					if (!_.isEmpty(after)) {
						
						if ((this.sortable === true && !_.isEqual(before, after)) || (this.sortable !== true && !_.isEqual(_.sortBy(before), _.sortBy(after))))
							this.model.set(this.name, items);
					
					} else if (this.model.has(this.name))
						this.model.unset(this.name);
					
				} else {
					
					if ((model = this.collection.first()) && (model instanceof Parse.Object)) {

						if (!this.model.has(this.name) || this.model.get(this.name).id !== model.id)
							this.model.set(this.name, model);
					
					} else if (this.model.has(this.name))
						this.model.unset(this.name);
					
				}
				
			}
			
			return Parse.Promise.as();
					
		},
		
		
		onImageStart : function (iterator) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.onImageStart');
			
		},
		
		
		onImageProgress : function (iterator, file, progress) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.onImageProgress');
			
		},
		
		
		onImageRead : function (iterator, file, content) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.onImageRead');
			
			if (this.collection.length >= this.limit)
				return iterator.finish();
			
			if (_.contains(['image/jpeg', 'image/png', 'image/gif'], file.type)) {
				
				var self = this;
				
				var builder = new ImageBuilderControl(file, content);
			
				builder.make(this.variants).then(
					
					function (variants) {
						
						var model = new ImageModel();
						
						_.each(variants, function (variant) {
							
							this.set(variant.name, variant.file);
							
						}, model);
						
						self.collection.add(model);
						
						iterator.next();
						
					},
					function (error) {
						
						app.view.alert(
							self.parent.$alertContainer || self.$el,
							'danger',
							'Failed to upload image',
							error.message,
							false
						);
						
						iterator.next();
						
					}
					
				);

				builder.run();
				
			} else {
				
				app.view.alert(
					this.parent.$alertContainer || this.$el,
					'danger',
					'Failed to add image',
					'Unsupported image type',
					false
				);
				
				iterator.next();
				
			}
			
		},
		
		
		onImageFinish : function (iterator) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ImageList.onImageFinish');
			
		}
		
		
	});
	
	return view;

});