// Validator defaults for Armarium

define([
	'jquery-validation'
], function (
) {

	$.validator.setDefaults({
		errorElement	: 'span',
		errorClass		: 'form-error',
		validClass		: 'form-success',
		errorPlacement	: function (message, element) {
			var container = $(element).parents('.form-group');
			container.append(message);
		},
		ignore			: '.ignore',
		showErrors		: function (errorMap, errorList) {
						
			if (_.isArray(errorList) && !_.isEmpty(errorList)) {
			
				var
					first = _.first(errorList),
					$first = $(first.element),
					$tabPane = $first.parents('.tab-pane'),
					tabId = $tabPane.attr('id');
					
				if (!$tabPane.hasClass('active')) {
					
					var $tab = $tabPane.parents('.modal-body').find('[data-toggle="tab"][href="#' + tabId + '"]');
					$tab.tab('show');
					
				}
					
			}
			
			this.defaultShowErrors();
			
		}
	});

});