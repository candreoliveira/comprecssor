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
  "input": {},
  "output": {
    "mapFile": "",
    "jsFile": "",
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

var regenerateHtml = R.curry(function(config, map, file) {
  var hasPrefixOrSuffix = M.hasPrefixOrSuffix;
  var fileName = M.generatedFileName;
  var minFileName = M.generatedMinFileName;

  var replaceTokens = R.replace(M.regex, function(str) {
    var noQuotesStr = R.replace(/[\"\']/g, '', str);

    if (noQuotesStr === 'id=' || noQuotesStr === 'class=') {
      return str;
    }

    var index = R.strIndexOf('=', noQuotesStr) + 1;
    var type = R.substringTo(index, noQuotesStr);
    var substr = R.substringFrom(index, noQuotesStr);

    return R.compose(
      S(R.concat, S, '"'),
      R.concat(type),
      R.concat('"'),
      R.trim,
      R.reduce(function(acc, value) {
        return (map[value] ? map[value] : value) + ' ' + acc;
      }, ''),
      R.reject(R.isEmpty),
      R.split(' '),
      R.trim)(substr);
  });

  if (!hasPrefixOrSuffix(config, file)) {
    F.ensureFile(fileName(config, file), function() {
      var read = F.readStream(file);
      var write = F.writeStream(fileName(config, file));
      read
        .pipe(F.transformStream(replaceTokens, {objectMode: true}))
        .pipe(write)
        .on('finish', function () {
          // TODO: Permit override
          var options = {
            // removeAttributeQuotes: true,
            customAttrCollapse: /ng\-class/,
            minifyURLs: true,
            minifyCSS: true,
            minifyJS: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          };

          F.writeFile(
            minFileName(config, file),
            M.uglify(F.readFileSync(fileName(config, file)).toString(), options),
            error);
        });
    });
  }
});

var regenerateCss = R.curry(function(config, file, map) {
  var hasPrefixOrSuffix = C.hasPrefixOrSuffix;
  var fileName = C.generatedFileName;
  var minFileName = C.generatedMinFileName;

  var replaceTokens = R.replace(C.regex, function(str) {
    var tail = R.substringFrom(1, str);
    var head = R.substringTo(1, str);
    return map[tail] ? head + map[tail] : str;
  });

  if (!hasPrefixOrSuffix(config, file)) {
    F.ensureFile(fileName(config, file), function() {
      var read = F.readStream(file);
      var write = F.writeStream(fileName(config, file));
      read
        .pipe(F.transformStream(replaceTokens, {objectMode: true}))
        .pipe(write)
        .on('finish', function () {
          // TODO: Use clean-css and permit options override
          F.writeFile(
            minFileName(config, file),
            C.uglify([fileName(config, file)]),
            error);
        });
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
    R.propOr({}, 'input')
  )(config);
});

var writeMap = R.curry(function(config, output) {
  R.compose(
    H.of(S(F.outputJson, S, output, {}, error)),
    H.Maybe,
    R.prop('mapFile'),
    R.propOr({}, 'output'))(config);
});

var writeJs = R.curry(function(config, output) {
  var file = R.compose(
    R.propOr(false, 'jsFile'),
    R.propOr({}, 'output'))(config);

  if (file) {
    var content = '(function() {\n';
    content += '\tvar map =\t' + JSON.stringify(output, null, 4) + ';\n';
    content += '\twindow.comprecssor = function(key) {\n\t\treturn map[key];\n\t}\n';
    content += '})();';
    F.writeFile(file, content, error);
  }
});

//P generateMap : Object, Array, Array, String => Object
//  Generate simple classes and ids, rewrite css file and returns map object
var generateMap = R.curry(function(ids, classes, file) {
  var assocIndexed = R.curry(function(indexSkip, obj, number, index) {
    obj[number] = B.toBase64(index + indexSkip);
    return obj;
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
    mapClasses(classes),
    mapIds
  )(ids);
});

//P callbackCss : Object, Fn, Array => void
var callbackCss = R.curry(function(config, err, files) {
  error(err);

  var ids = [];
  var classes = [];
  var total = files.length;

  R.forEach(function(file) {
    var readline = F.readStream(file);

    readline.on('data', function(line) {
      var t = C.tokens(line+'');
      ids = R.uniq(ids.concat(t.ids));
      classes = R.uniq(classes.concat(t.classes));
    });

    readline.on('end', function() {
      R.compose(
        regenerateCss(config, file),
        generateMap(ids, classes))(file);

      if (--total === 0) {
        var map = generateMap(ids, classes, file);
        writeMap(config, map);
        writeJs(config, map);
        execHtml(config, map);
      }
    });
  })(files);
});

var execCss = function(config) {
  R.compose(
    R.forEach(S(F.glob, S, {}, callbackCss(getConfig(config)))),
    H.orElse([]),
    H.of(R.propOr([], 'files')),
    H.Maybe,
    R.prop('css'),
    R.propOr({}, 'input')
  )(getConfig(config));
};

module.exports = function(config) {
  return {
    exec: function() {
      var endTimer = timer('[COMPREcssOR] EXECUTION TIME');
      process.on("exit", function() {
        endTimer();
      });

      execCss(config);
    }
  };
};