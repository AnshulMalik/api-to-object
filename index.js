const fs = require('fs');
const util = require('./util');
const http = require('http');
const https = require('https');
const querystring = require('querystring');

class Client {
    constructor(routes) {
        if(!routes) {
            throw new Error("Routes config is required");
        }
        if(typeof routes == 'string') {
            try {
                routes = JSON.parse(routes);
            }
            catch(e) {
                throw new Error("Error parsing config file", e);
            }
        }
        this.routes = routes;
        this.setupRoutes();
    }

    setupRoutes() {
        let routes = this.routes;
        this.generateApi(routes.api);
    }

    generateApi(routes, histRoutes = "") {
        let self = this;
        let parts = histRoutes.split('/');
        // Nested API, we need up update self to point last object
        if(parts.length > 1) {

            for(let i = 1; i < parts.length; i++) {
                self = self[util.toCamelCase(parts[i])];
            }
        }
        Object.keys(routes).forEach((key) => {
            // Key name will become the intermediate method
            // for all the endpoints
            let sub = routes[key];
            let curRoute = histRoutes + '/' + key;
            let cur = util.toCamelCase(key);
            if(sub.url) {
                // Consider end of recursion when url is present in sub
                self[cur] = (obj) => {
                    return new Promise((resolve, reject) => {
                        try {
                            let body = this.validateParams(obj, sub.params);
                            let options = {
                                host: this.routes.defines.constants.host,
                                port: this.routes.defines.constants.port,
                                path: sub.url,
                                method: sub.method,
                                headers: {
                                    'content-type': sub.contentType || 'application/json'
                                }
                            };

                            // Sets the query parameters on get request
                            if(options.method === 'GET') {
                                options.path += '?' + querystring.stringify(body);
                            }

                            // User https if api is hosted on https
                            let transport = (options.port === 443) ? https: http;

                            let req = transport.request(options, (res) => {
                                res.setEncoding("utf8");
                                let data = "";
                                res.on("data", function(chunk) {
                                    data += chunk;
                                });
                                res.on("error", function(err) {
                                    console.log('Error occured in http request', err);
                                });
                                res.on("end", function() {
                                    console.log('Request ended');
                                    if (res.statusCode >= 400 && res.statusCode < 600 || res.statusCode < 10) {
                                        reject(new Error(data));
                                    } else {
                                        if(res.headers['content-type'].indexOf('application/json') !== -1) {
                                            try {
                                                res.data = JSON.parse(data);
                                            }
                                            catch(e) {
                                                reject(e);
                                            }
                                        }
                                        else
                                            res.data = data;
                                        resolve(res);
                                    }
                                });
                            });
                            let hasBody ='get|delete|head'.indexOf(sub.method.toLowerCase()) === -1;
                            if(hasBody) {
                                console.log('writing to request, ', JSON.stringify(body));
                                req.write(JSON.stringify(body));
                            }
                            req.end();
                        }
                        catch(e){
                            reject(e);
                        }
                    });
                };
            }
            else {
                // Dig deeper (recursion)
                if(cur.length)
                    self[cur] = {};
                this.generateApi(routes[key], curRoute);
            }

        });
    }

    validateParams(obj, paramsList) {
        // Validates provided parameters with that of
        // required parameters for request
        let params = Object.keys(paramsList);

        for( let parameter of params) {
            let def = this.routes.defines.params[parameter];
            let val = obj[parameter];
            if(val) {
                if(typeof val != def.type.toLowerCase())
                    throw new Error(parameter + " value incompatible");
            }
            else if(def.required) {
                throw new Error(parameter + " is required");
            }
        }

        return obj;
    }
}

module.exports = (config) => {
    return new Client(config);
};
