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
var C = require('./src/css.js')(R, H, S);
var M = require('./src/html.js')(R, H, S);

//
// CONFIG FILES
//

var defaultConfig = {
  "mapFile": "map.comprecssor.json",
  "input": {},
  "output": {
    "css": {
      "prefix": "",
      "suffix": "comprecssor",
      "path": "",
      "shallow": false
    },
    "html": {
      "prefix": "",
      "suffix": "comprecssor",
      "path": "",
      "shallow": false
    }
  }
};

//
// AUXILIARY FUNCTIONS
//

var getConfig = R.merge(defaultConfig);

var error = R.ifElse(R.isNil, R.identity, H.error);

function timer(name) {
  console.time(name);
  return function() {
    console.timeEnd(name);
  }
}

//P processCss : Fn, String => Void
//  Reads file to extract ids and classes and execute callback with
var processCss = R.curry(function(callback, file) {
  var ids = [];
  var classes = [];
  var readline = F.readStream(file);

  readline.on('data', function(line){
    var t = C.tokens(line+'');
    ids = R.uniq(ids.concat(t.ids));
    classes = R.uniq(classes.concat(t.classes));
  });

  readline.on('end', function(){
    callback(ids, classes, file);
  });
});

var regenerateHtml = R.curry(function(config, map, callback, file) {
  console.log('REG', config, map);

  var hasPrefixOrSuffix = M.hasPrefixOrSuffix;
  var fileName = M.generatedFileName;

  var replaceTokens = R.replace(M.regex, function(str) {
    return R.compose(
      R.trim,
      R.reduce(function(acc, value) {
        return R.concat(R.concat(map[value], ' '), acc);
      }, ''),
      R.reject(R.isEmpty),
      R.split(' '),
      R.trim);
  });

  if (!hasPrefixOrSuffix(config, file)) {
    F.ensureFile(fileName(config, file), function() {
      var read = F.readStream(file);
      var write = F.writeStream(fileName(config, file));
      read.pipe(F.transformStream(replaceTokens, {objectMode: true})).pipe(write);
      read.on('end', callback);
    });
  }
});

var regenerateCss = R.curry(function(config, file, map) {
  var hasPrefixOrSuffix = C.hasPrefixOrSuffix;
  var fileName = C.generatedFileName;

  var replaceTokens = R.replace(C.regex, function(str) {
    var tail = R.substringFrom(1, str);
    var head = R.substringTo(1, str);
    return map[tail] ? head + map[tail] : str;
  });

  if (!hasPrefixOrSuffix(config, file)) {
    F.ensureFile(fileName(config, file), function() {
      var read = F.readStream(file);
      var write = F.writeStream(fileName(config, file));
      read.pipe(F.transformStream(replaceTokens, {objectMode: true})).pipe(write);
    });
  }
});

//P callbackHtml : Object, Fn, Array => void
var callbackHtml = R.curry(function(config, map, err, files) {
  error(err);
  R.forEach(regenerateHtml(config, map))(files);
});

var execHtml = R.curry(function(config, map) {
  R.compose(
    R.forEach(S(F.glob, S, {}, callbackHtml(config, map))),
    H.orElse([]),
    H.of(R.prop('files')),
    H.Maybe,
    R.prop('html'),
    R.prop('input')
  )(config);
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
    execHtml(config),
    R.tap(regenerateCss(config, file)),
    R.tap(mapOutput(config)),
    mapClasses(classes),
    mapIds
  )(ids);
});

//P callbackCss : Object, Fn, Array => void
var callbackCss = R.curry(function(config, err, files) {
  error(err);
  R.forEach(processCss(generateMap(config)))(files);
});

var execCss = function(config) {
  R.compose(
    R.forEach(S(F.glob, S, {}, callbackCss(getConfig(config)))),
    H.orElse([]),
    H.of(R.prop('files')),
    H.Maybe,
    R.prop('css'),
    R.prop('input')
  )(getConfig(config));
};

module.exports = function(config) {
  return {
    exec: function() {
      var endTimer = timer('[COMPREcssOR] EXECUTION TIME');
      R.compose(
        endTimer,
        execCss
      )(config);
    }
  };
};