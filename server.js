var express = require('express'),
    http = require('http'),
    path = require('path'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    url = require('url'),
    util = require('util'),
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

app.get('/', function(req, res) {
	if(req.session.oauthAccessToken) {
    var token = req.session.oauthAccessToken;
    var client = new Evernote.Client({
      token: token,
      sandbox: true
    });
    var noteStore = client.getNoteStore();
    noteStore.listNotebooks(function(err, notebooks){
      req.session.notebooks = notebooks;
      res.end(util.format('<h1>%s</h1>', notebooks[0].name));
    });
  } else {
    res.redirect('/oauth');
  }
});

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
	var client = new Evernote.Client({
	  consumerKey: 'natansil',
	  consumerSecret: '1791cd44d28f0e63',
	  sandbox: true
	});

  client.getAccessToken(
    req.session.oauthToken, 
    req.session.oauthTokenSecret, 
    req.query.oauth_verifier, 
    function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
      if(error) {
        console.log('error');
        console.log(error);
        res.redirect('/');
      } else {
        // store the access token in the session
        req.session.oauthAccessToken = oauthAccessToken;
        req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
        req.session.edamShard = results.edam_shard;
        req.session.edamUserId = results.edam_userId;
        req.session.edamExpires = results.edam_expires;
        req.session.edamNoteStoreUrl = results.edam_noteStoreUrl;
        req.session.edamWebApiUrlPrefix = results.edam_webApiUrlPrefix;
        res.redirect('/');
      }
    }
  );
});

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
