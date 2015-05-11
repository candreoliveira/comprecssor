// VENDOR DEPENDENCIES
var glob = require('glob');
var R = require('ramda');
var S = require('spots');

// DEPENDENCIES
var H = require('./src/helpers.js')(R);
var cssParser = require('./src/cssParser');

// CONFIGS
var config = require('./test/config/config.json') || {};

// CALLBACKS
var callbackCss = R.curry(function(err, files){
  if(err) {
    H.error(err);
  }

  return R.compose(
    R.forEach(H.log)
  )(files);
});

var execCss = R.compose(
  R.forEach(S(glob, S, {}, callbackCss)),
  H.orElse([]),
  H.of(R.prop('files')),
  H.Maybe
)(config.css);
