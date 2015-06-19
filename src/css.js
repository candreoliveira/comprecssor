module.exports = function(R, H, S){
  var O = require('./output.js')(R, H, S, 'css');
  var regex = /(?:(?!\/*.*\*\/)(?!\#(?:[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}))(?!\[.*)(?!.*\])[\.\#](-?[_a-zA-Z]+[_a-zA-Z0-9-]*)+)/g;

  var getTokens = function(line) {
    var getType = R.curry(function(type, tokens) {
      return R.compose(
        R.filter(
          R.compose(
            R.eq(type),
            R.head))
      )(tokens);
    });

    var tokens = R.uniq(line.match(regex) || []);
    var ids = R.compose(
      R.map(R.substringFrom(1)),
      getType('#'))(tokens);
    var classes = R.compose(
      R.map(R.substringFrom(1)),
      getType('.'))(tokens);

    return {
      ids: ids,
      classes: classes,
      tokens: tokens
    }
  }

  return {
    tokens: getTokens,
    regex: regex,
    hasPrefixOrSuffix: O.hasPrefixOrSuffix,
    hasPrefix: O.hasPrefix,
    hasSuffix: O.hasSuffix,
    suffix: O.suffix,
    prefix: O.prefix,
    shallow: O.shallow,
    path: O.path,
    generatedFileName: O.generatedFileName
  };
}