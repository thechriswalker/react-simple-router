var noop = function(){};

//browserify will put global.process.title = "browser" when in browser, so this
//is the most effective way of determining we aren't. in case this is used in a
//non-NodeJS server-side JavaScript environment.
var isServerSide = !(global.processs && global.process.title === "browser");

//check for history API support.
var historySupported = supportsHistory(global);

function supportsHistory(ctx) {
  if(isServerSide) return false; //in node.js on the server. no history!

  /* Taken from modernizr
   * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
   * https://github.com/Modernizr/Modernizr/blob/309edbe25d34358d5e06de01a26eeae4ba4945f4/feature-detects/history.js
   * but for updates worth checking:
   * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
   */
  var ua = ctx.navigator.userAgent;
  if ((ua.indexOf('Android 2.') !== -1 ||
      (ua.indexOf('Android 4.0') !== -1)) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1) {
    return false;
  }
  return (ctx.history && 'pushState' in ctx.history);
}

//stub this in case of no history support or server-side
exports.navigate = isServerSide ? noop : function(url){ window.location = url; }; //this is the trigger to perform a navigation, simplest case just do window.location.
exports.onNavigate = noop;    //this triggers that the current path has changed (e.g. time to update your current path and re-render)

if(!historySupported){
  return;
}

//below this line history is supported.
//as a plus. IE 10 is the first IE to support this, so we can use `addEventListener`
var window = global.window;

var origin = window.location.origin,
    protocol = window.location.protocol,
    currentURL = window.location.href;

// this checks for click on a link (or a link child, up to ten levels nested.)
function handleLinkEvent(evt){
  var path, node = evt.target, depth = 10;
  //assume we don't nest HTML more than `depth` levels deep to save recursing all the way up...
  while(node && --depth){
    if(node.nodeName === "A"){
      //this was a link, check origin (href is automagically resolved!)
      if(node.href.indexOf(origin) === 0){
        //same origin.
        evt.preventDefault();
        return navigate(node.href);
      }
      return;
    }
    node = node.parentNode;
  }
}

//this acutally does the history change.
function navigate(url, opts){
  if(!opts){
    opts = {};
  }
  url = fullURL(url);
  if(currentURL === url){
    return;
  }
  if(url.indexOf(origin) === 0){
    //OK this is same-origin
    window.history[ opts.replace ? "replaceState" : "pushState" ]({}, "", url);
    //when we do it ourselves, we need to call the handlers.
    //but let's do that async.
    process.nextTick(function(){
      currentURL = url;
      _onNavigate(url.replace(origin, ""));
    });
  }else{
    //not same origin, use window.location.
    window.location = url;
  }
}



function handlePopState(){
  //this is AFTER so we can get window.location.pathname to get the currentURL
  currentURL = window.location.href;
  _onNavigate(window.location.pathname);
}

//count calls so symmetric bind/unbinds don't overlap
var bound = false;
var _bindEvents = function(){
  if(bound) return;
  bound = true;
  //add interceptor for any link clicks that are "same-origin".
  //this handles the focus and enter case and touch events as well as click.
  window.addEventListener("click", handleLinkEvent);
  //this detects url change
  window.addEventListener("popstate", handlePopState);
};

//I don't actually use this at the moment. but it's here because it would be useful
//if this wasn't global -- but it kinda needs to be global, so there's the quandary.
var _unbindEvents = function(){
  if(!bound) return;
  bound = false;
  window.removeEventListener("click", handleLinkEvent);
  window.removeEventListener("popstate", handlePopState);
};

//we hold the nav callbacks in an array.
var navCallbacks = [];

//add a callback and optional ctx.
exports.onNavigate = function(fn, ctx){
  _bindEvents();
  navCallbacks.push(fn, ctx);
};

//this uses the callbacks and calls each one with it's context.
function _onNavigate(path){
  for(var i = 0, l = navCallbacks.length; i < l; i = i + 2){
    navCallbacks[i].call(navCallbacks[i+1], path);
  }
}

//this triggers the navigation.
exports.navigate = navigate;

//URL function to expand a url to a canonical form.
var includesSchema = /^https?:\/\//,
    protocolRelative = /^\/\//,
    absolutePath = /^\//, //provided you've checked the case above first...
    commonAltProto = /^(javascript|mailto|gopher|s?ftps?|ssh|git|magnet):/;

function fullURL(possibly_relative_url){
  if(includesSchema.test(possibly_relative_url) || commonAltProto.test(possibly_relative_url)){
    //it's a full URL or something we don't care about...
    return possibly_relative_url;
  }
  if(protocolRelative.test(possibly_relative_url)){
    //just add current proto.
    return protocol + possibly_relative_url;
  }
  if(absolutePath.test(possibly_relative_url)){
    //use origin
    return origin + possibly_relative_url;
  }
  //a relative path or just hash-fragment
  return origin + window.location.pathname + possibly_relative_url;
}