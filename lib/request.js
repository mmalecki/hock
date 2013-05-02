var fs = require('fs'),
    Stream = require('stream'),
    _ = require('underscore');

var Request = module.exports = function (parent, options) {
  this.method = options.method || 'GET';
  this.url = options.url;
  this.body = options.body || '';
  this.headers = options.headers || {};

  if (typeof options.body === 'object') {
    this.body = JSON.stringify(options.body);
  }

  this._defaultReplyHeaders = {};

  this._parent = parent;
};

Request.prototype.reply = function (statusCode, body, headers) {
  this.response = {
    statusCode: statusCode || 200,
    body: body || '',
    headers: headers
  };

  this._parent.enqueue(this);

  return this._parent;
};

Request.prototype.replyWithFile = function (statusCode, filePath, headers) {

  var readStream = fs.createReadStream(filePath);
  readStream.pause();

  return this.reply(statusCode, readStream, headers);
};

Request.prototype.isMatch = function(request) {
  var self = this;

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