var Mocha = require('mocha');
var glob = require('glob');
var conf = require('./mocha.conf.json');

module.exports = function() {
  var mocha = new Mocha(conf.opts);
  return {
    test:
  }
}