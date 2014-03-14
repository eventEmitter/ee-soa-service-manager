
    !function() {
        'use strict';

        var Class          = require('ee-class')
            , log          = require('ee-log')
            , EventEmitter = require('ee-event-emitter');

        module.exports = new Class({
            inherits: EventEmitter

            , _controllerList    : {}

            , _servicesLoadCount : 0
            , _loaded            : false

            , init: function(options) {
                this.options = options || {};

            }

            , request: function(req, res) {
                if(this._controllerList[req.controller]) this._controllerList[req.controller].request(req, res);
                //else //TODO: write error on res
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
                    this._addControllers(service.getControllerNames(), service);
                    loaded();
                }.bind(this));

                //log.info(this.this._controllerList);
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
                if(this._controllerList[controllerName]) throw new Error(controllerName + ' already managed by servicemanager');
                else this._controllerList[controllerName] = service;
            }

        });

    }();
