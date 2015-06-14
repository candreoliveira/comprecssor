var endTimer = timer();

//
// VENDOR
//

var B = require('bases');
var R = require('ramda');
var S = require('spots');

//
// DEPENDENCIES
//

var F = require('./src/file.js')();
var H = require('./src/helpers.js')(R);
var css = require('./src/css')(R);

//
// CONFIG FILES
//

var config = require('./test/config/config.json') || {};

//
// AUXILIARY FUNCTIONS
//

var error = R.ifElse(R.isNil, R.identity, H.error);

function timer() {
  var name = '[COMPREcssOR] Execution time';
  console.time(name);
  return function() {
    console.timeEnd(name);
  }
}

//P processCss : Fn, String => Void
//  Reads file to extract ids and classes and execute callback with
var processCss = R.curry(function(callback, file){
  var ids = [];
  var classes = [];
  var readline = F.readStream(file);

  readline.on('data', function(line){
    var t = css.tokens(line+'');
    ids = R.uniq(ids.concat(t.ids));
    classes = R.uniq(classes.concat(t.classes));
  });

  readline.on('end', function(){
    callback(ids, classes, file);
  });
});

var regenerateCss = R.curry(function(config, file, map) {
  var prefix = R.compose(
    H.orElse(''),
    H.of(
      R.compose(
        R.ifElse(
          R.isEmpty,
            R.always(''),
            S(R.concat, S, '\.')),
        R.propOr('', 'prefix'))),
    H.Maybe,
    R.prop('output'));

  var suffix = R.compose(
    H.orElse('\.css'),
    H.of(
      R.compose(
        R.ifElse(
          R.isEmpty,
            R.always(''),
            R.compose(
              R.concat('\.'),
              S(R.concat, S, '\.css'))),
        R.propOr('', 'suffix'))),
    H.Maybe,
    R.prop('output'));

  var fileName = R.compose(
    R.concat(prefix(config)),
    R.replace('\.css', suffix(config)))(file);

  var replaceTokens = R.replace(new RegExp(R.keys(map).join('|'), 'g'), function(str) {
    return map[str] ? map[str] : str;
  });

  var read = F.readStream(file);
  var write = F.writeStream(fileName);


  // PREFIX NOT WORKING AND REGEX IS NOT APPROPRIATE
  read.pipe(F.transformStream(replaceTokens, {objectMode: true})).pipe(write);
});

//P generateMap : Object, Array, Array, String => Object
//  Generate simple classes and ids, rewrite css file and returns map object
var generateMap = R.curry(function(config, ids, classes, file) {
  var assocIndexed = R.curry(function(indexSkip, obj, number, index) {
    obj[number] = B.toBase64(index + indexSkip);
    return obj;
  });

  var mapOutput = R.curry(function(config, output) {
    R.compose(
      H.of(S(F.outputJson, S, output, {}, error)),
      H.Maybe,
      R.prop('mapFile'))(config);
  });

  var mapIds = R.reduceIndexed(function(acc, elem, idx, list) {
      return assocIndexed(0, acc, elem, idx);
    }, {});

  var mapClasses = R.curry(function(classes, output) {
    var skip = R.compose(R.prop('length'), R.keys)(output);

    return R.reduceIndexed(function(acc, elem, idx, list) {
      return assocIndexed(skip, acc, elem, idx);
    }, output)(classes);
  });

  return R.compose(
    R.tap(regenerateCss(config, file)),
    R.tap(mapOutput(config)),
    mapClasses(classes),
    mapIds
  )(ids);
});

//P callbackCss : Object, Fn, Array => void
var callbackCss = R.curry(function(config, err, files){
  error(err);
  R.compose(R.forEach(processCss(generateMap(config))))(files);
});

//
// EXECUTION
//

var execCss = function(config){
  return R.compose(
    endTimer,
    R.forEach(S(F.glob, S, {}, callbackCss(config))),
    H.orElse([]),
    H.of(R.prop('files')),
    H.Maybe,
    R.prop('css')
  )(config);
}

execCss(config);

module.exports = {
  generateMap: execCss
}