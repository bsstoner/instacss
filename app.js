define([
  'express',
  // 'mongoose',
  // 'controllers/loader',
  'module',
  'path',
  './config',
  'fs'
], function (express,/* mongoose, controllerLoader,*/ module, path, config, fs) {

  var app = null;

  console.log(global.process.env);

  // can't serve cache manifest w/ express static since it doesn't set the header
  // correctly. so we'll load the file once, keep it in memory, serve it up manually
  var filename = module.uri;
  var manifestFilename = 'dochub.appcache';
  var manifest = null;
  fs.readFile(path.dirname(filename) + '/static/' + manifestFilename, function(err,buf) {
    if(err)
      throw(err);
    manifest = {
      headers:{
        'Content-Type'  : 'text/cache-manifest',
        'Content-Length': buf.length,
        // 'Cache-Control' : 'public, max-age=' + 60*60 // do we need this caching?
      },
      body: buf
    };
  });
  var webapp_manifest = null;
  fs.readFile(path.dirname(filename) + '/static/manifest.webapp', function(err,buf) {
    if(err)
      throw(err);
    webapp_manifest = {
      headers:{
        'Content-Type'  : 'application/x-web-app-manifest+json',
        'Content-Length': buf.length,
      },
      body: buf
    };
  });

  return {
    initialize: function() {
      if ( app ) return;

      console.log('INITIALIZING APP');
      app = express.createServer();
      app.listen(config.app_port);

      app.configure(function() {
        // var db = mongoose.connect(config.mongo_uri, function(err) {
        //   if (err)
        //     throw err;
        //   else
        //     console.log('connected to ' + config.mongo_uri);
        // });
        app.use(express.logger({ format: ':method :url :status' }));
        // preempt static to serve up cache manifest
        app.get("/" + manifestFilename, function(req, res){
          res.writeHead(200,manifest.headers);
          res.end(manifest.body);
        });
        app.get("/manifest.webapp", function(req, res){
          res.writeHead(200,webapp_manifest.headers);
          res.end(webapp_manifest.body);
        });
        var staticDir = path.dirname(filename) + '/static';
        console.log('initializing static: ' + staticDir);
        app.use(express.static(staticDir));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        //controllerLoader.bootControllers(app);
        console.log('instacss version now running on port ' + config.app_port);
      });
    },

    getApp: function() {
      return app;
    },
  };
});
