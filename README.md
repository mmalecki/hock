# hock [![Build Status](https://secure.travis-ci.org/mmalecki/hock.png?branch=master)](http://travis-ci.org/mmalecki/hock)

An HTTP mocking server based on [Nock](https://github.com/flatiron/nock).

## Overview

Hock is an HTTP mocking server with an API designed to closely match that of Nock. The key difference between Nock and Hock is that nock works by overriding `http.clientRequest`, allowing requests to be intercepted before they go over the wire.

Hock is designed as a fully functioning HTTP service. You enqueue requests and responses in a similar fashion to Nock:

```Javascript

    var hock = require('hock'),
        request = require('request');

    hock.createHock(12345, function(err, hockServer) {

        hockServer
            .get('/some/url')
            .reply(200, 'Hello!');

        request('http://localhost:12345/some/url', function(err, res, body) {
           console.log(body);
        });
    });

```

Unlike Nock, you create a Hock server with a callback based factory method. Behind the scenes, this spins up the new HTTP service, and begins listening to requests.

## HTTP Methods

Hock supports the 4 primary HTTP methods at this time:

* GET
* POST
* PUT
* DELETE
* HEAD

```Javascript
    // Returns a hock Request object
    var req = hockServer.get(url, requestHeaders);
```

```Javascript
    // Returns a hock Request object
    var req = hockServer.delete(url, requestHeaders);
```

```Javascript
    // Returns a hock Request object
    var req = hockServer.post(url, body, requestHeaders);
```

```Javascript
    // Returns a hock Request object
    var req = hockServer.put(url, body, requestHeaders);
```

```Javascript
    // Returns a hock Request object
    var req = hockServer.head(url, requestHeaders);
```

## Request Object

All of these methods return an instance of a `Request`, a hock object which contains all of the state for a mocked request. To define the response and enqueue into the `hockServer`, call either `reply` or `replyWithFile` on the `Request` object:

```Javascript
    // returns the current hockServer instance
    req.reply(statusCode, body, responseHeaders);
```

```Javascript
    // returns the current hockServer instance
    req.replyWithFile(statusCode, filePath, responseHeaders);
```

## Chaining requests

As the `reply` and `replyWithFile` methods return the current hockServer, you can chain them together:

```Javascript

    hockServer.put('/path/one', {
        foo: 1,
        bar: {
            baz: true
            biz: 'asdf1234'
        }
    })
    .reply(202, {
        status: 'OK'
    })
    .get('/my/file/should/be/here')
    .replyWithFile(200, __dirname + '/foo.jpg');

```

## Matching requests

When a request comes in, hock iterates through the queue in a First-in-first-out approach, so long as the request matches. The criteria for matching is based on the method and the url, and additionally the request body if the request is a `PUT` or `POST`. If you specify request headers, they will also be matched against before sending the response.
