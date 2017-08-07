define([
	'underscore',
    'parse'
], function(_, Parse) {
	
	var model = Parse.Object.extend('Product', {
		
		_types: {
			brand					: Parse.Object,
			name					: String,
			details					: String,
			pdpDetails				: String,
			pdpFit					: String,
			pdpSize					: String,
			pdpCompleteLook			: String,
			pdpLookType				: Number,
			stylist					: Parse.Object,
			pdpLookPartner			: String,
			styleNote				: String,
			pronoun					: String,
			shareLink				: String,
			styleCode				: String,
			color					: String,
			category1				: String,
			category2				: String,
			price					: Number,
			retailPrice				: Number,
			deliveryPrice			: Number,
			insurancePrice			: Number,
			delayBefore				: Number,
			delayAfter				: Number,
			sizes					: Array,
			quantity				: Number,
			photos					: Array,
			preview					: Parse.Object,
			searchable				: Array,
			indexedAt				: Date,
			sortOrder				: Number,
			hidden					: Boolean,
			published				: Boolean
		},
		
		pdpLookTypeEnum : [
			{id: 1, text: 'Style Brigade member, ...'},
			{id: 2, text: 'The ARMI team\'s'},
		],
		
		categoryEnum : [
			{id: 'HANDBAGS', text: 'HANDBAGS', children: [
				{id: 'HANDBAGS.BAG (NON-CLUTCH) [ACBG]', text: 'BAG (NON-CLUTCH) [ACBG]'},
				{id: 'HANDBAGS.CLUTCH [ACBC]', text: 'CLUTCH [ACBC]'}
			]},
			{id: 'ACCESSORIES', text: 'ACCESSORIES', children: [
				{id: 'ACCESSORIES.BRACELET [ACBR]', text: 'BRACELET [ACBR]'},
				{id: 'ACCESSORIES.EARRING [ACER]', text: 'EARRING [ACER]'},
				{id: 'ACCESSORIES.NECKLACE [ACNK]', text: 'NECKLACE [ACNK]'},
				{id: 'ACCESSORIES.RING [ACRG]', text: 'RING [ACRG]'},
				{id: 'ACCESSORIES.BELT [ACBT]', text: 'BELT [ACBT]'},
				{id: 'ACCESSORIES.HEADPIECE [ACHD]', text: 'HEADPIECE [ACHD]'}
			]},
			{id: 'JUMPSUITS', text: 'JUMPSUITS', children: [
				{id: 'JUMPSUITS.JUMPSUIT-ROMPERS [JMP]', text: 'JUMPSUIT-ROMPERS [JMP]'}
			]},
			{id: 'DRESSES', text: 'DRESSES', children: [
				{id: 'DRESSES.LONG HEM DRESS [DRL]', text: 'LONG HEM DRESS [DRL]'},
				{id: 'DRESSES.MIDI HEM DRESS [DRM]', text: 'MIDI HEM DRESS [DRM]'},
				{id: 'DRESSES.SHORT HEM DRESS [DRS]', text: 'SHORT HEM DRESS [DRS]'}
			]},
			{id: 'GOWNS', text: 'GOWNS', children: [
				{id: 'GOWNS.SHORT SLEEVE GOWN [GSS]', text: 'SHORT SLEEVE GOWN [GSS]'},
				{id: 'GOWNS.LONG SLEEVE GOWN [GLS]', text: 'LONG SLEEVE GOWN [GLS]'}
			]},
			{id: 'OUTERWEAR', text: 'OUTERWEAR', children: [
				{id: 'OUTERWEAR.JACKETS [OJK]', text: 'JACKETS [OJK]'},
				{id: 'OUTERWEAR.FURS [OFR]', text: 'FURS [OFR]'}
			]},
			{id: 'TOPS', text: 'TOPS', children: [
				{id: 'TOPS.CAPES/PONCHOS [CPPO]', text: 'CAPES/PONCHOS [CPPO]'},
				{id: 'TOPS.LONG SLEEVE TOP [TLS]', text: 'LONG SLEEVE TOP [TLS]'},
				{id: 'TOPS.SHORT SLEEVE KNIT [KNS]', text: 'SHORT SLEEVE KNIT [KNS]'},
				{id: 'TOPS.LONG SLEEVE KNIT [KNL]', text: 'LONG SLEEVE KNIT [KNL]'},
				{id: 'TOPS.VEST TOP [TVS]', text: 'VEST TOP [TVS]'},
				{id: 'TOPS.SHORT SLEEVE TOP [TSS]', text: 'SHORT SLEEVE TOP [TSS]'}
			]},
			{id: 'BOTTOMS', text: 'BOTTOMS', children: [
				{id: 'BOTTOMS.TROUSERS [BTR]', text: 'TROUSERS [BTR]'},
				{id: 'BOTTOMS.SKIRT [BSK]', text: 'SKIRT [BSK]'}
			]}
		],
		
		_formats: {
			
			_sizes : function (model) {

				var result = _
					.chain(model.get('sizes'))
					.map(function (size) {return size.has('name') ? size.get('name') : null;})
					.compact()
					.value();
				
				return result;
				
			}
			
		},
		
		order : undefined,
		
		
		initialize: function () {
			
			this.order = undefined;
			
		},
		
		
		doOrderChange: function (value) {
			
			if (_.isUndefined(this.order))
				this.order = this.get('sortOrder');
			
			var changed = this.order !== value;
			 
			this.order = value;
			
			if (changed)
				this.trigger('change');
			
		},
		
		
		doOrderApply: function (value) {
			
			if (this.order !== this.get('sortOrder'))
				this.set('sortOrder', this.order);
			
		},
		
		
		isOrderChanged: function () {
			
			return this.get('sortOrder') !== this.order;
			
		},
		
		
		format : function (type) {
			return _.has(this._formats, type) ? this._formats[type](this) : null;
		}
		
	});
	
	return model;

});