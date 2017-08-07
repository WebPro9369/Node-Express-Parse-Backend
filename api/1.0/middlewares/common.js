var _ = require('underscore');
var Cookie = require('../libs/cookie');

var cookieKey = 'parse.sess';
var cookieOptions = {
	cookie : {
		maxAge : 3600000
	}
};

exports.corsHandler = function (req, res, next) {
	
	res.set('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type,If-None-Match');
	res.set('Access-Control-Allow-Origin', req.get('Origin'));
	res.set('Access-Control-Allow-Credentials', true);
	
	if (req.method === 'OPTIONS')
		res.status(200).send('OK')
	
	else
		next();
	
}

exports.headerHandler = function (req, res, next) {
	
	var signatureSecret = req.secret;
	var cookie = new Cookie(cookieOptions);

	// Ignore if cookie path does not match.
	if (req.originalUrl.indexOf(cookie.path) !== 0)
		return next();
	
	var reqCookieJson;
	var reqCookieBody = req.cookies[cookieKey];
	
	if (!_.isEmpty(reqCookieBody)) {

		try {
			
			reqCookieJson = JSON.parse(reqCookieBody);
			
			if (reqCookieJson && !reqCookieJson.id || !reqCookieJson.sessionToken)
				throw "Invalid session";

		} catch (e) {
			console.warn("Invalid Parse session cookie");
		}
		
    }
    
	if (!reqCookieJson || !reqCookieJson.id || !reqCookieJson.sessionToken)
		return next();
	
	Parse.User.enableUnsafeCurrentUser();
	
	Parse.User.become(reqCookieJson.sessionToken).then(
		
		function(user) {
			
			req.user = user;
			next();
			
		},
		function(error) {
			
			next('Invalid session');
			
		}
		
	);
	
}

exports.sessionHandler = function (req, res, next) {
	
	var cookie = new Cookie(cookieOptions);
	
	var cookieValue;
	
	if (req.user instanceof Parse.User) {
		
		var session = {
			id : req.user.id,
			sessionToken : req.user.getSessionToken()
		};

		cookieValue = JSON.stringify(session);
		cookieValue = cookie.serialize(cookieKey, cookieValue);
		
	} else {
		
		cookie.expires = new Date(0);
		cookieValue = cookie.serialize(cookieKey, '');
        
	}
	
	res.setHeader('Set-Cookie', cookieValue);

	next();
}

exports.errorHandler = function(error, req, res, next) {
	
	console.log('errorHandler')
	console.log(error)
	
	res.status(400).json(error);
	
}


exports.successHandler = function (req, res, next) {
	
	console.log('successHandler')
	
	res.status(200).json(req.result);
		
}