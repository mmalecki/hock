var http = require('http'),
    Request = require('./request');

var Hock = module.exports = function (options) {
  if (typeof options === 'number') {
    this.port = options;
    options = {};
  }
  else if (typeof options === 'object' && options.port) {
    this.port = options.port;
  }
  else {
    throw new Error('Port is required');
  }
  else {
    this.config = options;
  }

  this._assertions = [];
  this._started = false;
};

Hock.prototype.enqueue = function (request) {
  if (this._requestFilter) {
    request._requestFilter = this._requestFilter;
  }

  if (this._defaultReplyHeaders) {
    request._defaultReplyHeaders = this._defaultReplyHeaders;
  }

  this._assertions.push(request);
};

Hock.prototype.done = function () {
  if (this._assertions.length) {
    throw new Error('Unprocessed Requests in Assertions Queue: \n' + JSON.stringify(this._assertions.map(function (item) {
      return item.method + ' ' + item.url;
    })));
  }
};

Hock.prototype.close = function (callback) {
  this._server.close(callback);
};

Hock.prototype._initialize = function (callback) {
  var self = this;

  if (self._started) {
    callback(new Error('Server is already listening'));
    return;
  }

  self._server = http.createServer(this._handleRequest());
  self._server.listen(self.port, function () {
    self._started = true;
    callback(null, self);
  });
};

Hock.prototype.get = function (url, headers) {
  return new Request(this, {
    method: 'GET',
    url: url,
    headers: headers || {}
  });
};

Hock.prototype.head = function (url, headers) {
  return new Request(this, {
    method: 'HEAD',
    url: url,
    headers: headers || {}
  });
};

Hock.prototype.put = function (url, body, headers) {
  return new Request(this, {
    method: 'PUT',
    url: url,
    body: body || '',
    headers: headers || {}
  });
};

Hock.prototype.post = function (url, body, headers) {
  return new Request(this, {
    method: 'POST',
    url: url,
    body: body || '',
    headers: headers || {}
  });
};

Hock.prototype.delete = function (url, headers) {
  return new Request(this, {
    method: 'DELETE',
    url: url,
    headers: headers || {}
  });
};

Hock.prototype.filteringRequestBody = function (filter) {
  this._requestFilter = filter;
  return this;
};

Hock.prototype.filteringRequestBodyRegEx = function (source, replace) {
  this._requestFilter = function (path) {
    if (path) {
      path = path.replace(source, replace);
    }
    return path;
  };

  return this;
};

Hock.prototype.clearBodyFilter = function () {
  delete this._requestFilter;
  return this;
}

Hock.prototype.defaultReplyHeaders = function (headers) {
  this._defaultReplyHeaders = headers;
  return this;
};

Hock.prototype._handleRequest = function () {
  var self = this;

  return function (req, res) {
    var matchIndex = null,
      request;

    req.body = '';

    req.on('data', function (data) {
      req.body += data.toString();
    });

    req.on('end', function () {

      for (var i = 0; i < self._assertions.length; i++) {
        if (self._assertions[i].isMatch(req)) {
          matchIndex = i;
          break;
        }
      }

      if (matchIndex === null) {
        if (self.config.throwOnUnmatched) {
          throw new Error('No Match For: ' + req.method + ' ' + req.url);
        }

        console.error('No Match For: ' + req.method + ' ' + req.url);
        if (req.method === 'PUT' || req.method === 'POST') {
          console.error(req.body);
        }
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('No Matching Response!\n');
      }
      else {
        request = self._assertions.splice(matchIndex, 1)[0];
        request.sendResponse(res);
      }
    });
  }
};


var createHock = function(options, callback) {
  var hock = new Hock(options);
  hock._initialize(callback);
  return hock;
};
module.exports = createHock;
module.exports.createHock = createHock;
