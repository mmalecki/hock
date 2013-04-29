var fs = require('fs'),
    Stream = require('stream');

var Request = module.exports = function (parent, options) {
  this.method = options.method || 'GET';
  this.url = options.url;
  this.body = options.body || '';
  this.headers = options.headers || {};

  if (typeof options.body === 'object') {
    this.body = JSON.stringify(options.body);
  }

  this._parent = parent;
};

Request.prototype.reply = function (statusCode, body, headers) {
  this.response = {
    statusCode: statusCode || 200,
    body: body || '',
    headers: headers || {}
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
  if (request.method === 'GET' || request.method === 'DELETE') {
    return this.method === request.method && request.url === this.url;
  }
  else {
    return this.method === request.method && this.url === request.url &&
      this.body === request.body;
  }
};

Request.prototype.sendResponse = function(response) {
  response.writeHead(this.response.statusCode, this.response.headers);

  if (this.response.body instanceof Stream) {
    this.response.body.pipe(response);
    this.response.body.resume();
  }
  else {
    response.end(this.response.body);
  }
};