
    !function() {
        'use strict';

        var Class          = require('ee-class')
            , log          = require('ee-log')
            , EventEmitter = require('ee-event-emitter');

        module.exports = new Class({
            inherits: EventEmitter

            , _controllerList       : {}
            , _serviceList          : []
            
            , _servicesLoadCount    : 0
            , _loaded               : false

            , init: function(options) {
                this.options = options || {};

            }

            , _hasController: function(controllerName) {
                return Object.hasOwnProperty.call(this._controllerList, controllerName);
            }

            , request: function(req, res) {
                log(req);
                // for(var property in req){
                //     var buffer = property;
                //     if(typeof req[property] === 'function'){
                //         buffer += '()';
                //     }
                //     log(buffer);
                // }

                var collection = req.getCollection();

                if(this._hasController(collection)) this._controllerList[collection].request(req, res);                
                else res.send(res.status.SERVICE_EXCEPTION, {error: 1, msg: collection + " not managed by serviceManager"});
            }

            , _handleRequest: function(req, res) {
                var collection = req.getCollection();

                if(this._hasController(collection)) {
                    this._controllerList[collection].request(req, res);
                }
                else {
                    this.emit('request', req, res);
                }
            }

            , use: function(service) {
                //TODO: check if service is a ee-service
                var loaded = function() {
                    this._servicesLoadCount--;
                    if(this._servicesLoadCount === 0) {
                        this._loaded = true;
                        this.emit('load');
                    }
                }.bind(this);

                this._servicesLoadCount++;
                this._loaded = false;

                service.onLoad(function(err) {
                    this._serviceList.push(service);
                    this._addControllers(service.getControllerNames(), service);
                    loaded();
                }.bind(this));

                service.on('request', this._handleRequest.bind(this));
            }

            , useMiddleware: function(middleware) {
                this.onLoad(function(err) {
                    this._serviceList.forEach(function(service) {
                        service.useMiddleware(middleware);
                    }.bind(this));
                }.bind(this));
            }

            , onLoad: function(callback) {
                if(this._loaded) callback();
                else this.on('load', callback);
            }

            , _addControllers: function(controllerNames, service) {
                controllerNames.forEach(function(controllerName) {
                    this._addController(controllerName, service);
                }.bind(this));
            }

            , _addController: function(controllerName, service) {
                if(this._hasController(controllerName)) throw new Error(controllerName + ' already managed by servicemanager');
                else this._controllerList[controllerName] = service;
            }

        });

    }();
