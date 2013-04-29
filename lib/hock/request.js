var Request = module.exports = function (parent, options) {
  this.method = options.method || 'GET';
  this.url = options.url;
  this.body = options.body || '';
  this.headers = options.headers || {};

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
