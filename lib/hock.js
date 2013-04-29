var Assertion = require('./hock/assertion.js');

module.exports = function () {
  return new Hock();
};

var Hock = module.exports.Hock = function () {
  this.assertions = [];
};

Hock.prototype.get = function (url, body) {
  var assertion = new Reply(this, url, body);
};
