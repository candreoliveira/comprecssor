// VENDOR DEPENDENCIES
var glob = require('glob');
var async = require('async');
var R = require('ramda');
var S = require('spots');

// DEPENDENCIES
var H = require('./src/helpers.js')(R);
var css = require('./src/css')(R);
var reader = require('./src/reader.js');

// CONFIGS
var config = require('./test/config/config.json') || {};
var cssTokens = [];

// CALLBACKS
var processLineCss = function(file, callback){
  var readline = reader(file);

  readline.on('line', function(line){
    cssTokens = R.uniq(cssTokens.concat(css.tokens(line)));
  });

  readline.on('end', function(){
    H.log(cssTokens);
    callback();
  });
}

var error = R.compose(
  R.ifElse(R.isNil, R.identity, H.error)
);

var callbackCss = R.curry(function(err, files){
  error(err);

  return R.compose(
    // S(async.each, S, processLineCss, function(err){
    //   error(err);
    //   H.log('COMPLETE')
    // })
  )(files);
});

var execCss = R.compose(
  R.forEach(S(glob, S, {}, callbackCss)),
  H.orElse([]),
  H.of(R.prop('files')),
  H.Maybe
)(config.css);

