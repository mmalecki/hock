var Assertion = module.exports = function (parent, url, body) {
  this.url = url;
  this.requestBody = body;
  this._parent = parent;
};

Assertion.prototype.reply = function (status, body) {
  this.status = status;
  this.replyBody = body;
  this._parent.assertions.push(this);
  return this._parent;
};
