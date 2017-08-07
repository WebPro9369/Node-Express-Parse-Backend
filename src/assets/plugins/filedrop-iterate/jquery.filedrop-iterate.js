/* global jQuery */
/*
  FileDrop jQuery Plugin (with added atob support)
  by Chris Barr
  https://github.com/chrismbarr/FileDrop/
*/

(function ($) {
    'use strict';

    var exitTimer = null;
    
    function FileIterator (files, options) {
    	
    	this.current = null;
    	
    	this.files = files;
    	
    	this.currentSize = 0;
    	this.totalSize = 0;
    	
    	$.each(this.files, function (file) {
    		this.totalSize += file.size;
    	})
    	
    }
    
    
    FileIterator.prototype.length = function () {
    	return this.files.length || 0;
    }
    
    
    FileIterator.prototype.progress = function () {
    	return {currentCount: this.current, totalCount: this.files.length, currentSize: this.currentSize, totalSize: this.totalSize};
    }
    
    
    FileIterator.prototype.list = function () {
    	
    	return $.map(this.files, function (file) {
    		
    		return {
    			name: file.name,
    			size: file.size
    		}
    		
    	});
    	
    }
    
    
    FileIterator.prototype.start = function () {
    	
    	if (this.current !== null)
    		return;
    	
    	if ($.isFunction(this.onStart))
    		this.onStart(this);
    	
    	if (this.files.length > 0)
    		this.current = 0;
    	else
    		this.current = -1;
    	
    	if (this.current == 0)
    		this.read();
    		
    	else if ($.isFunction(this.onFinish))
    		this.onFinish(this);
    	
    }
    
    
    FileIterator.prototype.next = function () {
    	
    	if (this.current === null) {
    		
    		this.start();
    		return;
    		
    	}
    	
    	if (this.current < this.files.length - 1)
    		this.current++;
    		
    	 else
    		this.current = -1;
    		
    	if (this.current >= 0)
    		this.read();
    	
    	else if ($.isFunction(this.onFinish))
    		this.onFinish(this);
    	
    }
    
    
    FileIterator.prototype.finish = function () {
    	
    	if (this.current === null || this.current === -1)
    		return;
    	
    	this.current = -1;
    	
    	if ($.isFunction(this.onFinish))
    		this.onFinish(this);
    	
    }
    
    
    FileIterator.prototype.read = function () {
    	
    	var file = this.files[this.current];
    	
    	var reader = new FileReader();

        var completeFn = (handleSingleFile)(this, this.current);

        if (reader.addEventListener) {
            reader.addEventListener('loadend', completeFn, false);
        } else {
            reader.onloadend = completeFn;
        }
        
        reader.readAsDataURL(file);
    	
    }
    
    FileIterator.prototype.decode = function (str, removeUriScheme, decodeBase64String) {
    	
    	if (removeUriScheme === true || decodeBase64String === true)
    		str = str.replace(/^data:.+?;base64,/, '');
    	
    	if (decodeBase64String === true) {
    		
    		str = window.atob(str);
    		try {
	            str = decodeURIComponent(window.escape(str));
	        } catch (ex) {
	            str = '';
	        }
	        
    	}
    	
    	return str;
    	
    }
    
    function handleSingleFile(iterator, current) {
    	
        return function (ev) {
        	
            var
            	content = ev.target.result,
            	file = iterator.files[current];
            
            iterator.currentSize += file.size;
            
            if ($.isFunction(iterator.onProgress))
				iterator.onProgress(iterator, file, iterator.progress());
            
			if ($.isFunction(iterator.onRead))
				iterator.onRead(iterator, file, content);

        };
        
    }
    
    
    function stopEvent(ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }

    
    //The options object is passed in and normalized
    function normalizeOptions(options) {
        //If a function was passed in instead of an options object,
        //just use this as the onFileList options instead
        if ($.isFunction(options)) {
            options = {
                onFileList: options
            };
        }

        //Create a finalized version of the options
        var opts = $.extend({}, $.fn.fileDropIterate.defaults, options);

        //This allows for string or jQuery selectors to be used
        opts.addClassTo = $(opts.addClassTo);

        //This option MUST be a function or else you can't really do anything...
        if (!$.isFunction(opts.onFileList)) {
            throw ('The option "onFileList" is not set to a function!');
        }

        return opts;
    }
    
    //This is called for each initially selected DOM element
    function setEvents(el, opts) {

        //can't bind these events with jQuery!
        el.addEventListener('dragenter', function (ev) {
            //Mouse over element
            $(opts.addClassTo).addClass(opts.overClass);
            stopEvent(ev);
        }, false);

        el.addEventListener('dragover', function (ev) {
            //Mouse exit element
            clearTimeout(exitTimer);
            exitTimer = setTimeout(function () {
                $(opts.addClassTo).removeClass(opts.overClass);
            }, 100);
            stopEvent(ev);
        }, false);
        
        var processFileListFn = function (fileList) {
        	
        	if ($.isFunction(opts.onFileList)) {
        		
        		var list = new FileIterator(fileList, opts);
        		
        		opts.onFileList(list);
        		return;
        	}
        	
        }

        el.addEventListener('drop', function (ev) {
            //Files dropped
            
            $(opts.addClassTo).removeClass(opts.overClass);
            stopEvent(ev);
            
            var fileList = ev.dataTransfer.files;
            
            processFileListFn(fileList);

        }, false);
        
        if (opts.clickable && opts.$reader) {
        	
	        el.addEventListener('click', function (ev) {
	        	stopEvent(ev);
	        	
	        	opts.$reader.trigger('click');
	        	
	        }, false);
	        
	        opts.$reader[0].addEventListener('change', function(ev) {
	        	
	        	stopEvent(ev);
	        	
	        	var fileList = ev.currentTarget.files;
	        	
	        	processFileListFn(fileList);
	        	
			}, false);
		
		}

    }

    //=============================================================================================
    
    
    //Extent jQuery.support to detect the support we need here
    $.support.fileDropIterate = (function () {
        return !!window.FileList;
    })();
    
    // jQuery plugin initialization
    $.fn.fileDropIterate = function (options) {
        var opts = normalizeOptions(options);

        //Return the elements & loop though them
        return this.each(function () {
            //Make a copy of the options for each selected element
            var perElementOptions = opts;
			
            //If this option was not set, make it the same as the drop area
            if (perElementOptions.addClassTo.length === 0) {
                perElementOptions.addClassTo = $(this);
            }
            
            if (perElementOptions.clickable) {
            	perElementOptions.$reader = $('<input type="file" multiple="multiple">').css('display', 'none');
            	perElementOptions.$reader.insertAfter($(this));
            }

            setEvents(this, perElementOptions);
        });
    };

    $.fn.fileDropIterate.defaults = {
        overClass: 'state-over',	//The class that will be added to an element when files are dragged over the window
        addClassTo: null,			//Nothing selected by default, in this case the class is added to the selected element
        onFileList: null,
        clickable: false			//
    };


})(jQuery);


//Add Base64 decode ability if the browser does not support it already
//NOTE: The below code can be removed if you do not plan on targeting IE9!
(function (window) {
    //Via: http://phpjs.org/functions/base64_decode/
    function base64_decode(data) {
        /*jshint bitwise: false, eqeqeq:false*/
        var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            dec = '',
            tmp_arr = [];

        if (!data) {
            return data;
        }

        data += '';

        do { // unpack four hexets into three octets using index points in b64
            h1 = b64.indexOf(data.charAt(i++));
            h2 = b64.indexOf(data.charAt(i++));
            h3 = b64.indexOf(data.charAt(i++));
            h4 = b64.indexOf(data.charAt(i++));

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            o1 = bits >> 16 & 0xff;
            o2 = bits >> 8 & 0xff;
            o3 = bits & 0xff;

            if (h3 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1);
            } else if (h4 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1, o2);
            } else {
                tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
            }
        } while (i < data.length);

        dec = tmp_arr.join('');

        return dec;
    }

    if (!window.atob) {
        window.atob = base64_decode;
    }

})(window);