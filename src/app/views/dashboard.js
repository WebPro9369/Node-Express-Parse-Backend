define([
    'jquery',
    'underscore',
    'parse',
    
    'text!templates/dashboard.html'
], function(
	$, _, Parse,
	dashboardTemplate
) {

	var view = Parse.View.extend({
		
		el : '#body',
		
		initialize : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DashboardView.initialize');
			
			_.bindAll(this, 'render', 'updateBreadcrumb');
			
			this.template = _.template(dashboardTemplate);
			
		},
		
	
		render : function() {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('DashboardView.render');
			
			this.$el.html(this.template());
			
		},
		
		
		updateBreadcrumb : function() {
			
			var path = [];
			
			path.push({text: 'Home', title: 'Home page'});
			
			app.view.breadcrumb.reset(path);
			
		}
		
		
	});
	
	return view;

});