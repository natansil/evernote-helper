var express = require('express'),
    http = require('http'),
    path = require('path'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    url = require('url'),
    Evernote = require('evernote').Evernote;

var app = express();

// Configurations

app.set('port', process.env.PORT || 3000);
app.use(session({secret: 'mama mia',
	      resave: false,
	      saveUninitialized: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

var callbackPath = "/oauth_callback";


app.get('/oauth', function(req, res) {
  var client = new Evernote.Client({
	  consumerKey: 'natansil',
	  consumerSecret: '1791cd44d28f0e63',
	  sandbox: true
	});

	var callbackUrl = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: callbackPath
  });

	client.getRequestToken(callbackUrl, function(error, oauthToken, oauthTokenSecret, results) {
	  if(error) {
	      req.session.error = JSON.stringify(error);
	      res.redirect('/');
	    }
	    else { 
	      // store the tokens in the session
	      req.session.oauthToken = oauthToken;
	      req.session.oauthTokenSecret = oauthTokenSecret;

	      // redirect the user to authorize the token
	      res.redirect(client.getAuthorizeUrl(oauthToken));
	    }
	});
});


app.get('/oauth_callback', function(req, res) {
	res.end('<h1>hello world</h1>')
});

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
