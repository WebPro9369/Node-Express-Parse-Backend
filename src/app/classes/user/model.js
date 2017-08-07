define([
    'parse'
], function(Parse) {
	
	var model = Parse.Object.extend('_User', {
		
		_types: {
			username				: String,
			fullName				: String,
			zipcode					: String,
			phoneNumber				: String,
			group					: Array,
			productWishList			: Array,
			customerProfile			: Object,
			defaultShippingAddress	: Parse.Object,
			defaultPaymentCard		: Parse.Object,
			confirmed				: Boolean,
			sharedLink				: Array,
			referrer				: Parse.Object,
			isCharged				: Boolean,
			balance					: Number
		},
		
		_formats: {
			_formatted: function (model) {
				return _.compact([model.get('fullName'), model.get('phoneNumber')]).join(' ');
			}/*,
			_group : function (model) {
				
				var groups = _
					.chain(model.groupEnum)
					.filter(function (value) {return _.contains(this, value.id);}, model.get('group') || [])
					.map(function (value) {return value.text;})
					.value();
				
				return groups;
				
			}*/
		},
		
		/*groupEnum : [
			{id: USER_GROUP_VIP		, text: 'VIP'},
			{id: USER_GROUP_FREE	, text: 'Free'}
		],*/

		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		},
		
		
		groups : function () {
			
			return _.map(this.groupEnum, function (group) {
				
				var result = group;
				
				result.active = this.has('group') ? _.contains(this.get('group'), group.id) : false;
				
				return result;
				
			}, this);
			
		}
		
	});
	
	return model;

});