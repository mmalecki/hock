'use strict';

var qs = require('querystring'),
    url_ = require('url'),
    http = require('http'),
    util = require('util'),
    events = require('events').EventEmitter,
    Request = require('./request'),
    deepEqual = require('deep-equal'),
    urlEqual = require('url-equal');

/**
 * Hock class
 *
 * @description This is the main class for Hock. It handles creation
 * of the underlying webserver, and enqueing all of the requests.
 *
 * @param {object}      [options]       options for your Hock server
 * @param {boolean}     [options.throwOnUnmatched]  Tell Hock to throw if
 *    receiving a request without a match (Default=true)
 *
 * @type {Function}
 */
var Hock = module.exports = function (options) {
  options = options || {};
  this._throwOnUnmatched = (typeof options.throwOnUnmatched === 'boolean' ? options.throwOnUnmatched : true);
  this._assertions = [];
  this.handler = Hock.prototype.handler.bind(this);
  events.EventEmitter.call(this);
};
util.inherits(Hock, events.EventEmitter);

/**
 * Hock.enqueue
 *
 * @description enqueue a request into the queue
 *
 * @param {object}    request     The request to enter in the hock queue
 * @param request
 */
Hock.prototype.enqueue = function (request) {
  if (this._requestFilter) {
    request._requestFilter = this._requestFilter;
  }

  if (this._defaultReplyHeaders) {
    request._defaultReplyHeaders = this._defaultReplyHeaders;
  }

  this._assertions.push(request);
};

/**
 * Hock.hasRoute
 *
 * @description test if there is a request on the assertions queue
 *
 * @param {String}    method      the method of the request to match
 * @param {String}    url         the route of the request to match
 * @param {String}    [body]      optionally - use if you set a body
 * @param {object}    [headers]   optionally - use if you set a header
 * @returns {Boolean}
 */
Hock.prototype.hasRoute = function (method, url, body, headers) {
  if (!body) {
    body = '';
  }

  if (!headers) {
    headers = {};
  }

  return this._assertions.some(function(request) {
    return request.isMatch({
      url,
      method,
      body,
      headers,
    })
  })
};

/**
 * Hock.done
 *
 * @description Throw an error if there are unprocessed requests in the assertions queue.
 * If there are unfinsihed requests, i.e. min: 2, max 4 with a count of 2, that request will be
 * ignored for the purposes of throwing an error.
 *
 */
Hock.prototype.done = function (cb) {
  var err;

  if (this._assertions.length) {
    this._assertions = this._assertions.filter(function(request) {
      return request.isDone();
    });

    if (this._assertions.length) {
      err = new Error('Unprocessed Requests in Assertions Queue: \n' + JSON.stringify(this._assertions.map(function (item) {
        return item.method + ' ' + item.url;
      })));
    }
  }

  if (!err) {
    return cb && cb();
  }

  if (!cb) {
    throw err;
  }

  return cb(err);

};

/**
 * Hock.get
 *
 * @description enqueue a GET request into the assertion queue
 *
 * @param {String}    url         the route of the request to match
 * @param {object}    [headers]   optionally match the request headers
 * @returns {Request}
 */
Hock.prototype.get = function (url, headers) {
  return new Request(this, {
    method: 'GET',
    url: url,
    headers: headers || {}
  });
};

/**
 * Hock.head
 *
 * @description enqueue a HEAD request into the assertion queue
 *
 * @param {String}    url         the route of the request to match
 * @param {object}    [headers]   optionally match the request headers
 * @returns {Request}
 */
Hock.prototype.head = function (url, headers) {
  return new Request(this, {
    method: 'HEAD',
    url: url,
    headers: headers || {}
  });
};

/**
 * Hock.put
 *
 * @description enqueue a PUT request into the assertion queue
 *
 * @param {String}          url         the route of the request to match
 * @param {object|String}   [body]      the request body (if any) of the request to match
 * @param {object}          [headers]   optionally match the request headers
 * @returns {Request}
 */
Hock.prototype.put = function (url, body, headers) {
  return new Request(this, {
    method: 'PUT',
    url: url,
    body: body || '',
    headers: headers || {}
  });
};

/**
 * Hock.patch
 *
 * @description enqueue a PATCH request into the assertion queue
 *
 * @param {String}          url         the route of the request to match
 * @param {object|String}   [body]      the request body (if any) of the request to match
 * @param {object}          [headers]   optionally match the request headers
 * @returns {Request}
 */
Hock.prototype.patch = function (url, body, headers) {
  return new Request(this, {
    method: 'PATCH',
    url: url,
    body: body || '',
    headers: headers || {}
  });
};

/**
 * Hock.post
 *
 * @description enqueue a POST request into the assertion queue
 *
 * @param {String}          url         the route of the request to match
 * @param {object|String}   [body]      the request body (if any) of the request to match
 * @param {object}          [headers]   optionally match the request headers
 * @returns {Request}
 */
Hock.prototype.post = function (url, body, headers) {
  return new Request(this, {
    method: 'POST',
    url: url,
    body: body || '',
    headers: headers || {}
  });
};

/**
 * Hock.delete
 *
 * @description enqueue a DELETE request into the assertion queue
 *
 * @param {String}          url         the route of the request to match
 * @param {object|String}   [body]      the request body (if any) of the request to match
 * @param {object}          [headers]   optionally match the request headers
 * @returns {Request}
 */
Hock.prototype.delete = function (url, body, headers) {
  return new Request(this, {
    method: 'DELETE',
    url: url,
    body: body || '',
    headers: headers || {}
  });
};

/**
 * Hock.copy
 *
 * @description enqueue a COPY request into the assertion queue
 *
 * @param {String}          url         the route of the request to match
 * @param {object|String}   [body]      the request body (if any) of the request to match
 * @param {object}          [headers]   optionally match the request headers
 * @returns {Request}
 */
Hock.prototype.copy = function (url, body, headers) {
  return new Request(this, {
    method: 'COPY',
    url: url,
    headers: headers || {}
  });
};

/**
 * Hock.options
 *
 * @description enqueue a OPTIONS request into the assertion queue
 *
 * @param {String}    url         the route of the request to match
 * @param {object}    [headers]   optionally match the request headers
 * @returns {Request}
 */
Hock.prototype.options = function (url, headers) {
  return new Request(this, {
    method: 'OPTIONS',
    url: url,
    headers: headers || {}
  });
};

/**
 * Hock.filteringRequestBody
 *
 * @description Provide a function to Hock to filter the request body
 *
 * @param {function}    filter    the function to filter on
 *
 * @returns {Hock}
 */
Hock.prototype.filteringRequestBody = function (filter) {
  this._requestFilter = filter;
  return this;
};

/**
 * Hock.filteringRequestBodyRegEx
 *
 * @description match incoming requests, and replace the body based on
 * a regular expression match
 *
 * @param {RegEx}       source    The source regular expression
 * @param {string}      replace   What to replace the source with
 *
 * @returns {Hock}
 */
Hock.prototype.filteringRequestBodyRegEx = function (source, replace) {
  this._requestFilter = function (path) {
    if (path) {
      path = path.replace(source, replace);
    }
    return path;
  };

  return this;
};

/**
 * Hock.filteringPath
 *
 * @description Provide a function to Hock to filter request path
 *
 * @param {function}    filter    the function to filter on
 *
 * @returns {Hock}
 */
Hock.prototype.filteringPath = function (filter) {
  this._pathFilter = filter;
  return this;
};

/**
 * Hock.filteringPathRegEx
 *
 * @description match incoming requests, and replace the path based on
 * a regular expression match
 *
 * @param {RegEx}       source    The source regular expression
 * @param {string}      replace   What to replace the source with
 *
 * @returns {Hock}
 */
Hock.prototype.filteringPathRegEx = function (source, replace) {
  this._pathFilter = function (path) {
    if (path) {
      path = path.replace(source, replace);
    }
    return path;
  };

  return this;
};

/**
 * Hock.clearBodyFilter
 *
 * @description clear the body request filter, if any
 *
 * @returns {Hock}
 */
Hock.prototype.clearBodyFilter = function () {
  delete this._requestFilter;
  return this;
}

/**
 * Hock.defaultReplyHeaders
 *
 * @description set standard headers for all responses
 *
 * @param {object}    headers   the list of headers to send by default
 *
 * @returns {Hock}
 */
Hock.prototype.defaultReplyHeaders = function (headers) {
  this._defaultReplyHeaders = headers;
  return this;
};

/**
 * Hock.handler
 *
 * @description Handle incoming requests
 *
 * @returns {Function}
 * @private
 */
Hock.prototype.handler = function (req, res) {
  var self = this;

  var matchIndex = null;

  req.body = '';

  req.on('data', function (data) {
    req.body += data.toString();
  });

  req.on('end', function () {

    const matchIndex = self._assertions.findIndex(assertion => assertion.isMatch(req));

    if (matchIndex === -1) {
      if (self._throwOnUnmatched) {
        throw new Error('No Match For: ' + req.method + ' ' + req.url);
      }

      console.error('No Match For: ' + req.method + ' ' + req.url);
      if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') {
        console.error(req.body);
      }
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('No Matching Response!\n');
    }
    else {
      if (self._assertions[matchIndex].sendResponse(req, res)) {
        self._assertions.splice(matchIndex, 1)[0];
      }
      if (self._assertions.length === 0) self.emit('done');
    }
  });
};

/**
 * exports.createHock
 *
 * @description static method for creating your hock server
 *
 * @param {object}      [options]       options for your Hock server
 * @param {Number}      [options.port]  port number for your Hock server
 * @param {boolean}     [options.throwOnUnmatched]  Tell Hock to throw if
 *    receiving a request without a match (Default=true)
 *
 * @returns {Hock}
 */
var createHock = function(options) {
  return new Hock(options);
};

module.exports = createHock;
module.exports.createHock = createHock;
