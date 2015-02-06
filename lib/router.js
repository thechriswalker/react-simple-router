var React = require("react"),
    urlPattern = require("url-pattern"),
    _ = require("lodash");

// The Router component does NOT automatically handle page changes for you.
// This may seem backwards, but I like everything to be props if I can help
// it - forcing a top-down declaration of how the page looks.
// The navigator class has the functionality needed for that.
module.exports = React.createClass({
  displayName: "Router",
  render: function(){
    var matched = this._matchRoute(this.props.path);
    if(!matched.handler){
      return null; //if using react 0.10.x use <noscript /> here.
    }
    return React.createElement(matched.handler, _.extend(this.props, matched.props));
  },
  //on update ensure the pre-computed routes are up to date, and clear any memoization
  componentWillUpdate: function(newProps){
    if(this.preComputeRoutes(newProps.routes)){
      //true returned here means something changed.
      this._matchRoute.cache = new _.memoize.Cache(); //drop memoization cache
    }
  },
  //this will be filled in by componentWillMount()
  _matchRoute: function(){},
  //We use componentWillMount as it happens before the initial render.
  //we want to memoize the route matching results for performance.
  //overkill on the serverside, but not too bad.
  componentWillMount: function(){
    var notFound = this.props.notFound;

    //ensure routes precomputed.
    this.preComputeRoutes(this.props.routes);

    this._matchRoute = _.memoize(function(path){
      var i, matches, result = {
        handler: notFound,
        props: {}
      };
      _.each(this._routes, function(route){
        if((matches = route.pattern.match(path)) !== null){
          result.handler = route.handler;
          matches = matches||{};
          _.each(matches, function(v,k){
            matches[k] = decodeURIComponent(matches[k]);
          });
          _.extend(result.props, matches);
          return false; //explicit false returns stops iteration early
        }
      });
      return result;
    });
  },
  //does the compilation of routes.
  preComputeRoutes: function(routes){
    if(!this._routes){
      this._routes = {};
    }
    //kinda don't want to do this if nothing changes...
    var newRoutes = {}, change = false;
    (routes||[]).forEach(function(r){
      var key = ""+r.pattern; //coerce to string
      //check route doesn't exist with the same handler.
      if(!(key in this._routes) || this._routes[key].handler !== r.handler){
        newRoutes[key] = {pattern: urlPattern.newPattern(r.pattern), handler: r.handler};
        change = true;
      }else{
        newRoutes[key] = this._routes[key];
      }
    }, this);
    this._routes = newRoutes;
    return change;
  }
});
