var fs = require('fs');
var path = require('path');
var express = require('express');
var _ = require('underscore');
var morgan = require('morgan');
var ParseServer = require('parse-server').ParseServer;
var S3Adapter = require('parse-server').S3Adapter;

var restApi_1_0 = require('./api/1.0/index');

// TODO remove this when it will be fixed in source
var bodyParser = require('body-parser');

var api = new ParseServer({
	appName			: 'Armarium',
	databaseURI		: process.env.MONGODB_URI,
	cloud			: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
	appId			: process.env.APP_ID,
	masterKey		: process.env.MASTER_KEY,
	serverURL		: process.env.SERVER_URL,
	publicServerURL	: process.env.PUBLIC_URL,
	filesAdapter	: new S3Adapter(
		process.env.S3_ACCESS_KEY,
		process.env.S3_SECRET_KEY,
		process.env.S3_BUCKET,
		{directAccess: true}
	),
	emailAdapter	: {
		module: 'parse-server-simple-mailgun-adapter',
		options: {
			fromAddress	: process.env.MAIL_FROM_ADDRESS,
			domain		: process.env.MAILGUN_DOMAIN,
			apiKey		: process.env.MAILGUN_API_KEY
		}
	},
	push: {
		ios: [
			{
				pfx: __dirname + '/cert/prod.p12',
				bundleId: 'com.armarium.armarium',
				/*bundleId: process.env.PUSH_IOS_BUNDLE_ID,
				passphrase: process.env.PUSH_PASSPHRASE,*/
				production: true
			}
		]
	}
});

var httpPort = process.env.PORT || 80;
var httpsPort = 443;

var app = express();

app.use(morgan('combined'));

app.use('/public', express.static(path.join(__dirname, '/public')));

if  (process.env.NODE_ENV !== 'production')
	app.use('/src', express.static(path.join(__dirname, '/src')));

// TODO remove this when it will be fixed in source
app.use(bodyParser.json());
app.use(function(req, res, next) {

	var where = req.body.where;
	
	if (where) {
		
		for (var key in where) {
			if (where[key].hasOwnProperty('__type')) {
				if (where[key].__type === 'Pointer') {
					where[key] = {
						"__type" : where[key].__type,
						"className" : where[key].className,
						"objectId" : where[key].objectId,
					}
				}
			}
		}
		
	}
	next(); 

});

app.use('/api/v1.0', restApi_1_0);

app.use(process.env.PARSE_MOUNT || '/parse', api);

var httpServer = require('http').createServer(app);

httpServer.listen(httpPort, function() {
	console.log('Express server listening on port ' + httpPort);
});

if  (process.env.NODE_ENV !== 'production') {
	
	var httpsServer = require('https').createServer(
/*	{
				key: fs.readFileSync('./ssl/nodejs.dev.key'),
		    cert: fs.readFileSync('./ssl/nodejs.dev.crt'),
		    requestCert: false,
		    rejectUnauthorized: false
		},*/
		app
	);
	
	httpsServer.listen(httpsPort, function() {
		console.log('Secure Express server listening on port ' + httpsPort);
	});

}