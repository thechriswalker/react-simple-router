# React Simple Router.

A Simple React Router that you can use on the server-side as well.

The lib is split into two parts: the `Router.Component` and the `Router.Navigator`.

The idea behind this is that we should always pass data in to our app from the top.
So the only singleton is the Navigator which will only be used client-side, where a
singleton is safe. On the server, navigate makes no sense and is stubbed out anyway.

The `Component` is a React Component used to build the structure for the app based
on URL. There are no `Route` sub-components, you define your routes and handlers as
an array or objects. The `Component` does not do any handling of changes to URL. Or
provide any hlpes to create navigation.

The `Navigation` is a module that provide 2 functions: `onNavigate` which is triggered
with the new `path` when a URL change happens and `navigate` used to trigger a change
or URL. `navigate(url, options)` takes an optional options object which so far only
looks for the key `replace` to be truthy. If `options.replace` is truthy then we
use


```javascript
var React = require("react"),
    Router = require("react-simple-router");

var NotFound = React.createClass({
  render: function(){
    return React.DOM.div(null, "Page Not Found: "+this.props.path);
  }
});

var PageOne = React.createClass({
  render: function(){
    return PageAny({matches: {pageNumber: 1}});
  }
});

var PageAny = React.createClass({
  render: function(){

    var anotherPage = "/page/"+Math.floor(Math.random()*1000);

    return React.DOM.div(null,
      React.DOM.h1(null, "Page "+this.props.matches.pageNumber+"! "),
      React.DOM.p(null, React.DOM.a({href: "/not_found_here" }, "404")),
      React.DOM.p(null, React.DOM.a({href: anotherPage }, anotherPage)),
      React.DOM.p(null, React.DOM.a({href: "https://google.com"}, "external link")),
      React.DOM.p({onClick: this.programmaticNavigate, style: { "cursor": "pointer" }}, "home (n.b. this is clickable)")
    );
  },
  programmaticNavigate: function(ev){
    ev.preventDefault();
    Router.Navigator.navigate("/");
  }
});

var _routes = [
  { pattern:"/", handler: PageOne },
  { pattern:"/page/:pageNumber", handler: PageAny}
];

var App = React.createClass({
  render: function(){
    return Router.Component({
      path: this.props.path,
      routes: _routes,
      notFound: NotFound
    });
  }
});

//now the wiring.
var app = React.renderComponent(App({ path: window.location.pathname }), document.body);

//add our navigation logic.
Router.Navigator.onNavigate(function(newPath){
  app.setProps({ path: newPath });
});
```
