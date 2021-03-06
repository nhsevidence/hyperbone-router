var _ = require('underscore');
var Route = require('route');
var hashchange = require('hashchange');
var Events = require('backbone-events').Events;
var routes = [];
var defaultRoute = false;
var Router;
var navigateTo;

var eventHandler = function( newHash ){
	redirect( newHash );
};

module.exports.navigateTo = navigateTo = function navigateTo( uri, options ){

	if(uri.substr(0,1)==='#') uri = uri.substr(1);
	if(uri.substr(0,1)!=='!') uri = '!' + uri;
	
	hashchange.updateHash(uri);
	if(options && options.trigger){
		redirect(uri);
	}
};

// when the hash changes...
var redirect = function redirect( uri ){
	if(uri.substr(0,1)==='#') uri = uri.substr(1);
	if(uri.substr(0,1)==='!') uri = uri.substr(1);
	// iterate twice..
	var turnOn = [];
	var turnOff = [];
	var ctx;
	routes.forEach(function(route){
		if (ctx = route.match(uri)){
			turnOn.push(function routeActivator(){
				route.active = uri;
				route.trigger('activate', ctx, uri);
			});
		} else if(route.active) {
			turnOff.push(function routeDeactivator(){
				route.active = false;
				route.trigger('deactivate', uri);
			});
		}
	});
	// if no routes matched..
	if (turnOn.length === 0 && defaultRoute){
		console.log('no matches');
		defaultRoute.active = uri;
		defaultRoute.trigger('activate', { id : '/default'}, uri);
	}
	turnOff.forEach(function(fn){fn();});
	turnOn.forEach(function(fn){fn();});
	
};

module.exports.Router = Router = function(){

	return this;

};

Router.prototype = {
	route : function(path, model){
		var route = new Route(path),
			ctrl,
			self = this;

		_.extend(route, Events);

		routes.push(route);

		if(model){
			route.on({
				activate : function( ctx, uri ){
					model.set('active', true);
					window.scrollTo(0,0);
				},
				deactivate : function(ctx, uri ){
					model.set('active', false);
				}
			});
		}

		ctrl = {
			on : function(event, fn){
				route.on(event, fn);
				return ctrl;
			},
			route : function(path, model){
				return self.route(path, model);
			},
			defaultRoute : function (model){
				return self.route(model);
			},
			listen : function(){
				self.listen();
				return self;
			}
		};
		return ctrl;
	},
	defaultRoute : function (model){
		// sorry, nasty cut-and-paste job this... 
		defaultRoute = {};

		var	ctrl,
			self = this;

		_.extend(defaultRoute, Events);

		if(model){
			defaultRoute.on({
				activate : function( ctx, uri ){
					model.set('active', true);
					window.scrollTo(0,0);
				},
				deactivate : function(ctx, uri ){
					model.set('active', false);
				}
			});
		}

		ctrl = {
			on : function(event, fn){
				defaultRoute.on(event, fn);
				return ctrl;
			},
			route : function(path, model){
				return self.route(path, model);
			},
			defaultRoute : function (model){
				return self.route(model);
			},
			listen : function(){
				self.listen();
				return self;
			}
		};
		return ctrl;
	},
	listen : function(){
		hashchange.update(eventHandler);
		hashchange.update();
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
	defaultRoute = false;

};