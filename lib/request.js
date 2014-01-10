var fs = require('fs'),
    Stream = require('stream'),
    _ = require('underscore');

/**
 * Request class
 *
 * @description This is the Request class for Hock. It represents a single request,
 * and the response to that request
 *
 * @param {object}      parent    the hock server this request belongs to
 * @param {object}      options
 * @param {String}      options.url         the route for the current request i.e. /foo/bar
 * @param {String|object}   [options.body]  optional request body
 *
 * @param {object}      [options.headers]   optional request headers
 * @param {object}      [options.method]    the method for the request (default=GET)
 *
 * @type {Function}
 */
var Request = module.exports = function (parent, options) {
  var self = this;

  this.method = options.method || 'GET';
  this.url = options.url;
  this.body = options.body || '';
  this.headers = options.headers || {};

  if (typeof options.body === 'object') {
    this.body = JSON.stringify(options.body);
  }

  _.forEach(_.keys(this.headers), function(key) {
    self.headers[key.toLowerCase()] = self.headers[key];
    delete self.headers[key];
  });

  this._defaultReplyHeaders = {};

  this._parent = parent;
};

/**
 * Request.reply
 *
 * @description provide the mocked reply for the current request
 *
 * @param {Number}          [statusCode]    Status Code for the response (200)
 * @param {String|object}   [body]          The body for the response
 * @param {object}          [headers]       Headers for the response
 * @returns {*}
 */
Request.prototype.reply = function (statusCode, body, headers) {
  this.response = {
    statusCode: statusCode || 200,
    body: body || '',
    headers: headers
  };

  this._parent.enqueue(this);

  return this._parent;
};

/**
 * Request.replyWithFile
 *
 * @description provide the mocked reply for the current request based on an input file
 *
 * @param {Number}          statusCode      Status Code for the response (200)
 * @param {String}          filePath        The path of the file to respond with
 * @param {object}          [headers]       Headers for the response
 * @returns {*}
 */
Request.prototype.replyWithFile = function (statusCode, filePath, headers) {

  var readStream = fs.createReadStream(filePath);
  readStream.pause();

  return this.reply(statusCode, readStream, headers);
};

/**
 * Request.isMatch
 *
 * @description identify if the current request matches the provided request
 *
 * @param {object}      request   The request from the Hock server
 *
 * @returns {boolean|*}
 */
Request.prototype.isMatch = function(request) {
  var self = this;

  if (this._parent._pathFilter) {
    request.url = this._parent._pathFilter(request.url);
  }

  if (request.method === 'GET' || request.method === 'DELETE') {
    return this.method === request.method && request.url === this.url && checkHeaders();
  }
  else {
    var body = request.body;
    if (this._requestFilter) {
      body = this._requestFilter(request.body);
    }

    return this.method === request.method && this.url === request.url &&
      this.body === body && checkHeaders();

  }

  function checkHeaders() {
    var match = true;
    _.forEach(_.keys(self.headers), function (key) {
      if (request.headers[key] && self.headers[key] !== request.headers[key]) {
        match = false;

      }
    });

    return match;
  }
};

/**
 * Request.sendResponse
 *
 * @description send the response to the provided Hock response
 *
 * @param {object}    response    The response object from the hock server
 */
Request.prototype.sendResponse = function(response) {

  var headers = this.response.headers || this._defaultReplyHeaders;

  response.writeHead(this.response.statusCode, headers);

  if (this.response.body instanceof Stream) {
    this.response.body.pipe(response);
    this.response.body.resume();
  }
  else if (typeof this.response.body === 'object') {
    response.end(JSON.stringify(this.response.body));
  }
  else {
    response.end(this.response.body);
  }
};
