var _ = require('underscore');
var Route = require('route');
var hashchange = require('hashchange');
var Events = require('backbone-events').Events;
var routes = [];
var Router;
var navigateTo;

var eventHandler = function( newHash ){
	redirect( newHash );
};

module.exports.navigateTo = navigateTo = function navigateTo( uri, options ){

	if(uri.substr(0,1)==="#") uri = uri.substr(1);
	if(uri.substr(0,1)!=="!") uri = "!" + uri; 
	
	hashchange.updateHash(uri);
	if(options && options.trigger){
		redirect(uri);
	}
};

// when the hash changes...
var redirect = function redirect( uri ){
	if(uri.substr(0,1)==="#") uri = uri.substr(1);
	if(uri.substr(0,1)==="!") uri = uri.substr(1);
	// iterate twice..
	var turnOn = [];
	var turnOff = [];
	var ctx;
	routes.forEach(function(route){
		if (ctx = route.match(uri)){
			turnOn.push(function routeActivator(){
				route.active = true;
				route.trigger('activate', ctx, uri);
			});
		} else if(route.active) {
			turnOff.push(function routeDeactivator(){
				route.active = false;
				route.trigger('deactivate', uri);
			});
		}
	});
	turnOff.forEach(function(fn){fn();});
	turnOn.forEach(function(fn){fn();});
};

module.exports.Router = Router = function(){

	return this;

};

Router.prototype = {
	route : function(path){
		var route = new Route(path),
			ctrl,
			self = this;

		_.extend(route, Events);

		routes.push(route);

		ctrl = {
			on : function(event, fn){
				route.on(event, fn);
				return ctrl;
			},
			route : function(path){
				return self.route(path);
			},
			listen : function(){
				hashchange.update(eventHandler);
				return self;				
			}
		};
		return ctrl;
	},
	navigateTo : function( path, options ){
		navigateTo(path, options);
		return this;

	}
};

module.exports.reset = function(){

	hashchange.unbind(eventHandler);

	routes.forEach(function(route){
		route.off();
	});
	routes = [];

}