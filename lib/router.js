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
    var matched = this.matchRoute(this.props.path);
    if(!matched.handler){
      return null; //if using react 0.10.x use <noscript /> here.
    }
    return matched.handler(matched.props);
  },
  //We use componentWillMount as it happens before the initial render.
  //we want to memoize the route matching results for performance.
  //overkill on the serverside, but not too bad.
  componentWillMount: function(){
    var props = _.omit(this.props, ["routes", "notFound", "children"]),
        routes = (this.props.routes||[]).map(function(r){
          return {pattern: urlPattern.newPattern(r.pattern), handler: r.handler};
        }),
        notFound = this.props.notFound;

    this.matchRoute = _.memoize(function(path){
      var i, matches, result = {
        handler: notFound,
        props: _.clone(props)
      };
      for(i = 0; i < routes.length; i++){
        if((matches = routes[i].pattern.match(path)) !== null){
          result.handler = routes[i].handler;
          _.extend(result.props, matches||{});
          break;
        }
      }
      return result;
    });
  }
});
