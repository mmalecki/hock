# hock [![Build Status](https://secure.travis-ci.org/mmalecki/hock.png?branch=master)](http://travis-ci.org/mmalecki/hock)

An HTTP mocking server with an API based on [Nock](https://github.com/nock/nock).

## Overview

Hock is an HTTP mocking server with an API designed to closely match that of Nock. The key difference between Nock and Hock is that nock works by overriding `http.clientRequest`, allowing requests to be intercepted before they go over the wire.

Hock is designed as a fully functioning HTTP service. You enqueue requests and responses in a similar fashion to Nock:
```Javascript

const http = require('http')
const hock = require('hock')
const request = require('request')

const mock = hock.createHock()
mock
  .get('/some/url')
  .reply(200, 'Hello!')

const server = http.createServer(mock.handler)
server.listen(1337, () => {
  request('http://localhost:1337/some/url', (err, res, body) => {
    console.log(body);
  })
})
```

## HTTP Methods

Hock supports the 5 primary HTTP methods at this time:

* GET
* POST
* PUT
* PATCH
* DELETE
* HEAD
* COPY
* OPTIONS

```Javascript
// Returns a hock Request object
const req = hockServer.get(url, requestHeaders)
```
```Javascript
// Returns a hock Request object
const req = hockServer.delete(url, requestHeaders)
```
```Javascript
// Returns a hock Request object
const req = hockServer.post(url, body, requestHeaders)
```
```Javascript
// Returns a hock Request object
const req = hockServer.put(url, body, requestHeaders)
```
```Javascript
// Returns a hock Request object
const req = hockServer.head(url, requestHeaders)
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

You can optionally send a ReadableStream with reply, for example testing with large responses without having to use a file on disk:

```Javascript
// returns the current hockServer instance
req.reply(statusCode, new RandomStream(10000), responseHeaders);
```

You can also provide functions instead of concrete values. These functions will be called with the matching incoming http request, and it useful in cases where the response body or headers need to be constructed based on the incoming request data:

```Javascript
// returns the current hockServer instance
req.reply(
  statusCode,
  function replyWithBody(request) {
    return body;
  },
  function replyWithHeaders(request) {
    return responseHeaders;
  }
);
```

## Multiple matching requests

You can optionally tell hock to match multiple requests for the same route:

```Javascript
hockServer
  .put('/path/one', {
    foo: 1,
    bar: {
      baz: true
      biz: 'asdf1234'
    }
  })
  .min(4)
  .max(10)
  .reply(202, {
    status: 'OK'
  })
```

Call `many` if you need to handle at least one, possibly
many requests:

```Javascript
hockServer
  .put('/path/one', {
    foo: 1,
    bar: {
      baz: true
      biz: 'asdf1234'
    }
  })
  .many() // min 1, max Unlimited
  .reply(202, {
    status: 'OK'
  })
```

Provide custom min and max options to `many`:

```Javascript
hockServer
  .put('/path/one', {
    foo: 1,
    bar: {
      baz: true
      biz: 'asdf1234'
    }
  })
  .many({
    min: 4,
    max: 10
  })
  .reply(202, {
    status: 'OK'
  })
```

Set infinite number of requests with `max(Infinity)`:

```Javascript
hockServer
  .put('/path/one', {
    foo: 1,
    bar: {
      baz: true
      biz: 'asdf1234'
    }
  })
  .max(Infinity)
  .reply(202, {
    status: 'OK'
  })
```

If you don't care how many or how few requests are served, you can use `any`:

```Javascript
hockServer
  .put('/path/one', {
    foo: 1,
    bar: {
      baz: true
      biz: 'asdf1234'
    }
  })
  .any() // equivalent to min(0), max(Infinity)
  .reply(202, {
    status: 'OK'
  })
```
### hockServer.done() with many

`hockServer.done()` will verify the number of requests fits within the
minimum and maximum constraints specified by `min`, `max`, `many` or `any`:

```js
hockServer.get('/').min(2)
request.get('/', () => {
  hockServer.done((err) => {
    console.error(err) // error, only made one request
  })
})
```

If the number of requests doesn't verify and you don't supply a callback
to `hockServer.done()` it will throw!

## Chaining requests

As the `reply` and `replyWithFile` methods return the current hockServer, you can chain them together:

```Javascript

hockServer
  .put('/path/one', {
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

When a request comes in, hock iterates through the queue in a First-in-first-out approach, so long as the request matches. The criteria for matching is based on the method and the url, and additionally the request body if the request is a `PUT`, `PATCH`, or `POST`. If you specify request headers, they will also be matched against before sending the response.

## Path filtering

You can filter paths using regex or a custom function, this is useful for things like timestamps that get appended to urls from clients.

```Javascript

hockServer
  .filteringPathRegEx(/timestamp=[^&]*/g, 'timestamp=123')
  .get('/url?timestamp=123')
  .reply(200, 'Hi!');
```
```Javascript
hockServer
  .filteringPath(function (p) {
    return '/url?timestamp=XXX';
  })
  .get('/url?timestamp=XXX')
  .reply(200, 'Hi!');
