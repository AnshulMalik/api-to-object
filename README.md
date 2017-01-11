# api-to-object

## Features

- All types of requests and methods supported
- Validation on each parameter of every request

## Usage

#### Create a routes.json file, it's structure is defined in routes-sample.json file

Say, config.json file looks like
```
{
    "defines": {
        "constants": {
            "host": "localhost",
            "port": 3000
        },
        "params":
            "token": {
                "type": "String",
                "required": false,
                "validation": "",
                "description": "ID token obtained from google login"
            },
            "username": {
                "type": "String",
                "required": true,
                "validation": "",
                "description": ""
            },
            "password": {
                "type": "String",
                "required": true,
                "validation": "",
                "description": ""
            }
        }
    },
    "api": {
        "authorization": {
            "admin-login": {
                "url": "/api/admin/login",
                "method": "POST",
                "params": {
                    "username": null,
                    "password": null
                }
            }
        },
        "user": {
            "me": {
                "url": "/api/me",
                "methods": "GET",
                "params": {
                    token: null,
                }
            }
        }
    }
}

```

You need to specify details like url, parameters, method etc for each
api endpoint, and also all parameters are to be defined in defines.params
section of the config file.

Main script can be written as:

```
const fs = require('fs');
const routes = fs.readFileSync('routes.json', 'utf8');
const myApi = require('api-to-object')(routes);

myApi.authorization.adminLogin({
    username: 'admin',
    password: 'cool'
}).then((res) => {
    // res contains the response from api
    console.log(res);
}).catch((err) => {
    // Error is thrown if anything goes in the process or
    // The response status is greater than 399
});
```

### Things to remember
- The script traverses deeper until it finds a block which defines url, consider that
as api endpoint
- Nested routes in config are considered in returned API object
e.g. authorization.adminLogin.
- We can have arbitrary level of nesting in config file.
- API methods are automatically converted from dashed to camelCase e.g.
if config file defines admin-login then it will be converted into adminLogin
