// VENDOR DEPENDENCIES
var glob = require('glob');
var fs = require('fs');
var R = require('ramda');
var S = require('spots');

// DEPENDENCIES
var H = require('./src/helpers.js')(R);
var css = require('./src/css')(R);
var reader = require('./src/reader.js');

// CONFIGS
var config = require('./test/config/config.json') || {};
var ids = [];
var classes = [];

// CALLBACKS
var processLineCss = R.curry(function(callback, file){
  var readline = reader(file);

  readline.on('data', function(line){
    var t = css.tokens(line+'');
    ids = R.uniq(ids.concat(t.ids));
    classes = R.uniq(classes.concat(t.classes));
  });

  readline.on('end', function(){
    callback(ids, classes);
  });
});

var error = R.compose(
  R.ifElse(R.isNil, R.identity, H.error)
);

var callbackCss = R.curry(function(err, files){
  error(err);

  return R.compose(
    R.forEach(processLineCss(function(ids, classes){
      H.log(ids);
      H.log(classes);
    }))
  )(files);
});

var execCss = R.compose(
  R.forEach(S(glob, S, {}, callbackCss)),
  H.orElse([]),
  H.of(R.prop('files')),
  H.Maybe,
  R.tap(function(x){
    fs.mkdir('.tmp', error);
    return x;
  })
)(config.css);
