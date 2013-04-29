var http = require('http'),
  Request = require('./request.js');

var Hock = module.exports = function (options) {
  if (typeof options === 'number') {
    this.config = {};
    this.config.port = options;
  }
  else if (typeof options !== 'object') {
    this.config = {
      port: 12345
    };
  }
  else if (!options.port) {
    this.config = options;
    this.config.port = 12345;
  }

  this._assertions = [];
  this._started = false;
  this._locked = false;
};

Hock.prototype.enqueue = function(request) {
  if (this._locked) {
    throw new Error('Hock only supports adding 1 request at a time');
  }

  this._locked = true;
  this._assertions.push(request);
  this._locked = false;
};

Hock.prototype.done = function() {
  if (this._assertions.length) {
    throw new Error('Unprocessed Requests in Assertions Queue: ', this._assertions);
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
  self._server.listen(self.config.port, function () {
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

Hock.prototype._handleRequest = function () {
  var self = this;

  return function (req, res) {
    var matchIndex = null,
        request;

    req.body = '';

    req.on('data', function(data) {
      req.body += data.toString();
    });

    req.on('end', function() {

      for (var i = 0; i < self._assertions.length; i++) {
        if (self._assertions[i].isMatch(req)) {
          matchIndex = i;
          break;
        }
      }

      if (matchIndex === null) {
        console.error('No Match!');
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



