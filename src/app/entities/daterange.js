define([
	'underscore',
	'moment'
], function(
	_, moment
) {
	
	
	function DateRange(from, till) {
		
		this._valid = true;
		
		this._from = _.isDefined(from) ? moment.utc(from).startOf('day') : null;
		this._till = _.isDefined(till) ? moment.utc(till).startOf('day') : null;
		
		if (_.isDefined(from))
			this._valid = this._valid && this._from.isValid();
		
		if (_.isDefined(till))
			this._valid = this._valid && this._till.isValid();
			
		if (this._valid && _.isDefined(from) && _.isDefined(till))
			this._valid = this._from.toDate() <= this._till.toDate();
		
	}
	
	
	DateRange.prototype.default = function (from, till) {
		
		if (this._valid && _.isDefined(from) && _.isNull(this._from)) {
			this._from = moment.utc(from).startOf('day');
			this._valid = this._valid && this._from.isValid();
		}
			
			
		if (this._valid && _.isDefined(till) && _.isNull(this._till)) {
			this._till = moment.utc(till).startOf('day');
			this._valid = this._valid && this._till.isValid();
		}
			
		return this;
		
	}
	
	
	DateRange.prototype.limit = function (from, till, restrict) {
		
		if (this._valid && _.isDefined(from) && _.isNotNull(this._from)) {
			
			from = moment.utc(from).startOf('day');
			this._valid = this._valid && from.isValid();
			
			if (this._valid && this._from.toDate() < from.toDate()) {
				
				if (restrict === true)
					this._valid = false;
				
				else
					this._from = from;
				
			}
			
		}
		
		if (this._valid && _.isDefined(till) && _.isNotNull(this._till)) {
			
			till = moment.utc(till).startOf('day');
			this._valid = this._valid && till.isValid();
			
			if (this._valid && till.toDate() < this._till.toDate()) {
				
				if (restrict === true)
					this._valid = false;
				
				else
					this._till = till;
				
			}
				
			
		}
		
		if (this._valid && _.isNotNull(this._from) && _.isNotNull(this._till))
			this._valid = this._valid && this._from.toDate() <= this._till.toDate();
		
		return this;
		
	}
	
	
	DateRange.prototype.extend = function (before, after, clone) {
		
		if (!this._valid || !this.defined())
			return this;
		
		if (clone === true) {
			
			var
				from = moment.utc(this._from).subtract('days', before),
				till = moment.utc(this._till).add('days', after);
			
			return new DateRange(from, till);
			
		} else {
			
			this._from.subtract('days', before);
			this._till.add('days', after);
			
			return this;
		}
		
	}
	
	
	DateRange.prototype.valid = function () {
		
		return this._valid;
		
	}
	
	
	DateRange.prototype.defined = function (partially) {
		
		return partially === true ? _.isNotNull(this._from) || _.isNotNull(this._till) : _.isNotNull(this._from) && _.isNotNull(this._till);
		
	}
	
	
	DateRange.prototype.from = function (asMoment) {
		
		return _.isNull(this._from) ? null : (asMoment === true ? moment.utc(this._from) : this._from.toDate());
		
	}
	
	
	DateRange.prototype.till = function (asMoment) {
		
		return _.isNull(this._from) ? null : (asMoment === true ? moment.utc(this._till) : this._till.toDate());
		
	}
	
	
	DateRange.prototype.count = function () {
		
		return this.defined() ? this._till.diff(this._from, 'days') + 1 : null;
		
	}
	
	
	DateRange.prototype.range = function (asTimestamp) {
		
		if (this.defined())
			return _.map(_.range(0, this.count()), function (offset) {
				return asTimestamp === true ? moment.utc(this._from).add('days', offset).valueOf() : moment.utc(this._from).add('days', offset).toDate();
			}, this);
		
		else
			return null;
		
	}
	
	
	return DateRange;
	
});