exports.encode = function (value) {
	
	var result = String(value || '');
	
	result = result.replace(/[^A-Za-z0-9\-]+/g, '-').replace(/\-+/, '-').replace(/^\-+/, '').replace(/\-+$/, '').toLowerCase();
	
	return result;
	
}