(function() {
    'use strict';

    const log = require('ee-log');
    const type = require('ee-types');
    const EventEmitter = require('events');





    module.exports = class ServiceManager extends EventEmitter {



        constructor() {
            super();


            this.controllerMap = new Map();
            this.services = new Set();
        }





        /**
         * returns a map of all controllers
         */
        getControllerMap(map) {
            for (const serviceName of this.controllerMap.keys()) this.controllerMap.get(serviceName).getControllerMap(map);
            return map;
        }






        /**
         * checks if a controlelr exists
         */
        hasController(controllerName) {
            return this.controllerMap.has(controllerName);
        }






        /**
         * incoming request handling
         */
        request(request, response) {
            const collection = request.getCollection();

            if (this.hasController(collection)) this.controllerMap.get(collection).request(request, response);
            else response.send(response.statusCodes.SERVICE_EXCEPTION, {error: 1, msg: `Unknown controller '${collection}'!`});
        }







        /**
         * register services
         */
        use(service) {
            if (!service.isService()) throw new Error('Attempt to register non service as service on the service manager. Make sure you register only services inheriting from the default service implementation!');
            this.services.add(service);
        }







        /**
         * load the services
         */
        load() {
            return Promise.all(Array.from(this.services).map((service) => {

                // listen for outgoing requests
                service.on('request', (request, response) => {
                    this.request(request, response);
                });



                if (type.function(service.onLoad)) {

                    // legacy
                    return new Promise((resolve, reject) => {
                        service.onLoad((err) => {
                            if (err) reject(err);
                            else {
                                this.registerControllers(service);
                                resolve();
                            }
                        });
                    });
                }
                else {


                    // the new way to do things
                    return service.ready().then(() => {
                        this.registerControllers(service);
                        return Promise.resolve();
                    });
                }
            }));
        }






        /**
         * add all controlelrs of a loaded service to the map
         */
        registerControllers(service) {
            service.getControllerNames().forEach((controllerName) => {
                if (this.controllerMap.has(controllerName)) throw new Error(`Cannot register controller '${controllerName}' for service '${service.name}': it was already registered by the service '${this.controllerMap.get(controllerName).name}'!`);
                this.controllerMap.set(controllerName, service);
            });
        }




        // legacy
        onLoad(callback) {
            this.load().then(() => {
                this.emit('load');
                callback();
            }).catch(callback);
        }
    };
})();
