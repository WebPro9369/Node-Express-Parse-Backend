define(['underscore', 'underscore+'], function(_) {
	
	require(['lodash'], function(lodash) {
		
		window.lodash = lodash.noConflict();
		
	});
	
	return _;
	
});