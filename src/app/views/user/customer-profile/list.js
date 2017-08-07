define([
    'underscore',
    'parse',
    
    'classes/customer-profile/collection',
    'classes/customer-profile/model',
    
    'views/user/customer-profile/item',
    
    'text!templates/user/customer-profile/list.html',
    
    'jstree'
], function (
	_, Parse,
	CustomerProfileCollection, CustomerProfileModel,
	CustomerProfileItem,
	listTemplate
) {

	var view = Parse.View.extend({
	
		events : {},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.initialize');
	
			_.bindAll(this, 'assign', 'sync', 'render', 'fetch', 'addOne', 'addAll');
			
			this.template = _.template(listTemplate);
			
			if (options.name)
				this.name = options.name;
			
			this.collection = new CustomerProfileCollection;
			this.collection.query = new Parse.Query(CustomerProfileModel);
			this.collection.query.exists('key');
			this.collection.query.equalTo('published', true);
			this.collection.query.ascending('sortOrder');
			this.collection.query.limit(PAGINATION_LIMIT);
			
			this._value = {};
			
			this.collection.bind('reset', this.addAll);
			
		},
		
		
		assign : function (model) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.assign ' + this.name);
			
			this.model = model;
			
			this.sync();
			
		},
		
		
		sync : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.sync ' + this.name);
			
			if (this.name && this.model.has(this.name))
				this._value = this.model.get(this.name) || {};
				
			else
				this._value = {};
			
			this.addAll();
			
		},
		
		
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.render');
	
			this.$el.html(this.template());
			
			this.$items = this.$('[role="items"]');
			
			$.jstree.plugins.values = function (options, parent) {
				
			    this.redraw_node = function(obj, deep, callback, force_draw) {
			    	
			        obj = parent.redraw_node.call(
			            this, obj, deep, callback, force_draw
			        );
			        if (obj) {
			            var node = this.get_node($(obj).attr('id'));
			            if (node && 
			                node.data &&
			                ( "values" in node.data ) ) {
			                $(obj).children('.jstree-anchor').append(
	                        '&nbsp;&mdash;&nbsp;<strong>' + node.data.values + '</strong>'
	                        );
			            }
			        }
			        return obj;
			    };
			    
			};
			
			$.jstree.defaults.values = {};
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.fetch');
			
			return this.collection.fetch();
			
		},
		
		
		addOne : function(model) {
			
			var
				key = model.get('key'),
				value = _.has(this._value, key) ? this._value[key] : null;
				
			var view = new CustomerProfileItem({model : model, value : value});
			this.$items.append(view.render().el);
			
		},
	
	
		addAll : function(collection, filter) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('CustomerProfileList.addAll');
			
			this.$items.jstree('destroy');
			
			if (this.collection.length > 0 && !_.isEmpty(this._value)) {
				
				this.$items.jstree({
					core	: {data: this.collection.toTree(null, this._value)},
					plugins	: ['values']
				});
				
			} else
				this.$items.html('<p class="alert bg-info"><i class="icon-bulb"></i> Customer profile is empty</p>');
			
		}
		
		
	});
	
	return view;

});