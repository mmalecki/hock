var Hock = require('./hock/hock');

exports.createHock = function(options, callback) {
  var hock = new Hock(options);

  hock._initialize(callback);
};