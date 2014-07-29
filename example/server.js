var http = require("http"),
    url = require('url'),
    fs = require("fs"),
    browserify = require("browserify");

var server = http.createServer(function(req, res){
  var f = url.parse(req.url).path;
  if(f === "/favicon.ico"){
    return res.end();
  }
  if(f === "/bundle.js"){
    return fs.createReadStream("bundle.js").pipe(res);
  }
  fs.createReadStream("index.html").pipe(res);
});

function startServer(){
  //start the server.
  var port = process.env.PORT||8000;
  server.listen(port, function(){
    console.log("server listening on port http://localhost:%d/", port);
  });
}

if(!~process.argv.indexOf("--rebuild") && fs.existsSync("bundle.js")){
  startServer();
}else{
  console.log("bundling js...");
browserify()
    .require("../index.js", {expose:"react-simple-router"})
    .require("react")
    .bundle()
    .on("end", startServer)
    .pipe(fs.createWriteStream("bundle.js"));
}
