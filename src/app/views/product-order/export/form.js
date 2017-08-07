define([
    'underscore',
    'parse',
    
    'classes/product-order/model',
    
    'text!templates/product-order/export/form.html',
    
    'excel-builder',
    'jquery-validation',
    'jquery-validation.defaults',
    'bootstrap-datepicker'
], function (
	_, Parse,
	ProductOrderModel,
	formTemplate,
	ExcelBuilder
) {
	
	var view = Parse.View.extend({
	
		events : {
			'changeDate [name="dateFrom"]'	: 'doDateChange',
			'changeDate [name="dateTill"]'	: 'doDateChange'
		},
		
		initialize : function(options) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderExportForm.initialize');
	
			_.bindAll(this, 'render', 'build', 'submit', 'doDateChange');
			
			this.template = _.template(formTemplate);
			
		},
		
		
		fetch : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderExportForm.fetch');
			
			var promises = [];
			
			return Parse.Promise.when(promises).then(

				null,
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while building product order export form',
						error.message,
						false 
					);
					
				}
				
			);
			
		},
	
	
		render : function() {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderExportForm.render');
	
			this.$el.html(this.template());
			
			this.$alertContainer = this.$('.modal-body');
			
			this.$dateFrom = this.$('[name="dateFrom"]');
			this.$dateTill = this.$('[name="dateTill"]');
			
			this.$el.validate({
				rules : {
					dateFrom : {
						required : true
					},
					dateTill : {
						required : true
					}
				},
				submitHandler	: this.submit
			});
			
			this.$('.input-daterange').bootstrapDatepicker({
				format		: 'mm/dd/yyyy'
			});
			
			return this;
			
		},
		
		
		build : function () {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderExportForm.build');
			
			this.$dateFrom.val('');
			this.$dateTill.val('');
			
			this.$el.valid();
			
			this.$('.modal').modal('show');
			
			this.$('[data-toggle="tab"]').first().tab('show');
			
		},
		
		
		submit : function(form) {
	
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderExportForm.submit');
	
			var self = this;
			
			var
				dateFrom, dateTill;
			
			if ((value = this.$dateFrom.val()) && (date = moment.utc(value)) && date.isValid())
				dateFrom = date;
			
			if ((value = this.$dateTill.val()) && (date = moment.utc(value)) && date.isValid())
				dateTill = date;
			
			var
				headers = [
					'Date of Transaction', 'Customer Name', 'Email', 'Phone #', 'Customer #', 'Order #',
					'Date From', 'Date Till', 'Product Amount', 'Product Discount', 'Product Total', 'Delivery Amount',
					'Delivery Discount', 'Delivery Total', 'Insurance Amount', 'Insurance Discount', 'Insurance Total',
					'Tax', 'Total Amount', 'Total Discount', 'Discount', 'Shipping Zip Code', 'Product', 'Size',
					'Style Code', 'Color', 'Rental Price', 'Retail Price'
				],
				data = [];
			
			app.view.alert(
				self.$alertContainer,
				'info',
				'Data export is started',
				'You will get notification when it will be finished.<br/><strong>Please don\'t leave this section until operation will be finished</strong>',
				5000
			);
			
			Parse.Promise.as().then(
				
				function () {
					
					var query = new Parse.Query('ProductOrder');
					query.include(['user', 'shippingAddress', 'product', 'productSize']);
					query.greaterThanOrEqualTo('createdAt', dateFrom.toDate());
					query.lessThanOrEqualTo('createdAt', dateTill.toDate());
					query.containsAll('state', [PRODUCT_ORDER_STATE_CONFIRMED, PRODUCT_ORDER_STATE_CHARGED]);
					return query.each(
						
						function (order) {
							
							data.push([
								(moment.utc(order.createdAt).unix() / 86400 + 25569) || null,
								(order.has('user') ? order.get('user').get('fullName') : null) || null,
								(order.has('user') ? order.get('user').get('username') : null) || null,
								(order.has('user') ? order.get('user').get('phoneNumber') : null) || null,
								(order.has('user') ? order.get('user').id : null) || null,
								order.get('orderNumber') || null,
								(order.has('dateFrom') ? moment.utc(order.get('dateFrom')).unix() / 86400 + 25569 : null) || null,
								(order.has('dateTill') ? moment.utc(order.get('dateTill')).unix() / 86400 + 25569 : null) || null,
								order.get('productPrice') || null,
								order.get('productDiscount') || null,
								order.get('productTotal') || null,
								order.get('deliveryPrice') || null,
								order.get('deliveryDiscount') || null,
								order.get('deliveryTotal') || null,
								order.get('insurancePrice') || null,
								order.get('insuranceDiscount') || null,
								order.get('insuranceTotal') || null,
								order.get('taxPrice') || null,
								order.get('totalPrice') || null,
								order.get('totalDiscount') || null,
								order.get('discountDescription') || null,
								(order.has('shippingAddress') && (shippingAddress = order.get('shippingAddress')) && shippingAddress.has('value') && (value = shippingAddress.get('value')) && _.isObject(value) ? value.postalCode : null) || null,
								(order.has('product') ? order.get('product').get('name') : null) || null,
								(order.has('productSize') ? order.get('productSize').get('name') : null) || null,
								(order.has('product') ? order.get('product').get('styleCode') : null) || null,
								(order.has('product') ? order.get('product').get('color') : null) || null,
								(order.has('product') ? order.get('product').get('price') : null) || null,
								(order.has('product') ? order.get('product').get('retailPrice') : null) || null
							]);
							
							return Parse.Promise.as();
							
						}
						
					);
					
				}
				
			).then(
				
				function () {
					
					var exportWorkbook = ExcelBuilder.Builder.createWorkbook();
					var productOrderWorksheet = exportWorkbook.createWorksheet({name: 'Product Order'});
					
					var stylesheet = exportWorkbook.getStyleSheet();
					
					var boldTextFormat = stylesheet.createFormat({
				        font: {
				            bold: true
				        }
				    });

					var datetimeFormat = stylesheet.createFormat({
						format: 'YYYY.MM.DD HH:MM:SS'
					});
					
					var dateFormat = stylesheet.createFormat({
						format: 'YYYY.MM.DD'
					});
					
					var currencyFormat = stylesheet.createFormat({
						format: '$#,##0.00'
					});
					
					headers = _.map(headers, function (value) {return {value: value, metadata: {style: boldTextFormat.id}};});
					
					data = _
					.chain(data)
					.sortBy(function (row, idx) {
						return -row[0] || 0;
					})
					.map(function (row, idx) {
						
						return _.map(
							row,
							function (value, i) {
								return this[i] ? {value: value, metadata: {style: this[i]}} : value;
							
							},
							[
								datetimeFormat.id,
								null,
								null,
								null,
								null,
								null,
								dateFormat.id,
								dateFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								currencyFormat.id,
								null,
								null,
								null,
								null,
								null,
								null,
								currencyFormat.id,
								currencyFormat.id
							]
						);
						
					})
					.value();
					
					productOrderWorksheet.setData(_.union([headers], data));
					
					exportWorkbook.addWorksheet(productOrderWorksheet);
					
					return ExcelBuilder.Builder.createFile(exportWorkbook);
					
				}
				
			).then(
				
				function (result) {
					
					app.view.alert(
						self.$alertContainer,
						'success',
						'Data is ready to download',
						'Click this <a href="data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + result + '" download="armarium-product-order from ' + dateFrom.format('YYYY-MM-DD') + ' till ' + dateFrom.format('YYYY-MM-DD') + '.xlsx">link</a> to open result.',
						false
					);
					
				},
				function (error) {
					
					app.view.alert(
						self.$alertContainer,
						'danger',
						'An error occurred while exporting data',
						error,
						false
					);
					
				}
				
			);
	
			return false;
	
		},
		
		
		doDateChange : function (ev) {
			
			if (app.DEBUG_LEVEL == DEBUG_LEVEL.TRACE) console.log('ProductOrderForm.doDateChange');
			
			this.$el.valid();
		
		}
		
		
	});
	
	return view;

});