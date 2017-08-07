// DynamicText

var _ = require('underscore');

(function(_) {
	
	function DynamicText(type, params) {
		
		this.type = type;
		this.params = params;
		
	}
	
	
	_.extend(DynamicText, {
		
		_templates : [
			
			'',
			'Style Brigade member, <a href="/personal-stylists#{{ params.stylist.objectId }}">{{ params.stylist.fullName }}</a>\'s edit of styles from {{ params.pdpLookPartner }} to complement your rented statement piece from the ARMI.',
			'The <a href="/personal-stylists">ARMI team</a>\'s edit of styles from {{ params.pdpLookPartner }} to complement your rented statement piece from the ARMI.',
			
			'{{ params.name }} - Runway Rentals | Armarium',
			'Browse the {{ params.name }} collection from Armarium. Rent designer dresses, high end accessories, and other luxury fashion to complete your runway look.',
			'/collections/{{ params.pageCode }}',
			
			'{{ params.brand.name }} - {{ params.name }} | Armarium',
			'{{ params.name }} | Armarium',
			'Rent the {{ params.name }} by {{ params.brand.name }} and other high fashion rentals from Armarium. Browse designer dresses and accessories today.',
			'Rent the {{ params.name }} and other high fashion rentals from Armarium. Browse designer dresses and accessories today.',
			'/product/{{ params.pageCode }}',
			
			'{{ params.fullName }} | Armarium Personal Stylists',
			'Get styled by {{ params.fullName }} or other experienced stylists for your special occasion. Browse designer dress and accessory rentals from Armarium today.',
			'/personal-stylists/{{ params.pageCode }}',
			
			'{{ params.title }} | World Armarium',
			'Read about {{ params.title }} and other style inspiration. Browse the latest stories and rent designer clothing and accessories from Armarium!',
			'/stories/{{ params.pageCode }}'
			
		]
		
	});
	
	
	DynamicText.prototype.toString = function () {
		
		var t, result;
		
		if (_.has(DynamicText._templates, this.type)) {
			
			t = _.template(DynamicText._templates[this.type], null, {interpolate: /\{\{(.+?)\}\}/g, variable: 'params'});
			
			try {
				result = t(this.params);
			} catch (e) {
				result = '';
			}
			
		}
		 
		return !_.isEmpty(result) ? result : undefined;
		
	}
	
	
	module.exports = DynamicText;
	
	 
} (_));