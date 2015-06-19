module.exports = function(R, H, S, type) {
  var testPrefixOrSuffix = R.curry(function(file, x) {
    return R.test(new RegExp(x), file);
  });

  //P path : Config => String
  var path = R.compose(
    H.orElse(''),
    H.of(
      R.compose(
        R.ifElse(
          R.isEmpty,
            R.concat('\.\/'),
            R.compose(R.concat('\.\/'), S(R.concat, S, '\/'))),
        R.propOr('', 'path'))),
    H.Maybe,
    R.prop(type),
    R.prop('output'));

  //P shallow : Config => Boolean
  var shallow = R.compose(
    H.orElse(false),
    H.of(R.propOr(false, 'shallow')),
    H.Maybe,
    R.prop(type),
    R.prop('output'));

  //P prefix : Config => String
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
    R.prop(type),
    R.prop('output'));

  //P suffix : Config => String
  var suffix = R.compose(
    H.orElse(R.concat('\.', type)),
    H.of(
      R.compose(
        R.ifElse(
          R.isEmpty,
            R.always(''),
            R.compose(
              R.concat('\.'),
              S(R.concat, S, R.concat('\.', type)))),
        R.propOr('', 'suffix'))),
    H.Maybe,
    R.prop(type),
    R.prop('output'));

  //P hasSuffix : Config => Boolean
  var hasSuffix = R.curry(function(config, file) {
    return R.compose(
      H.orElse(false),
      H.of(
        R.compose(
          R.ifElse(
            R.isEmpty,
              R.always(false),
              testPrefixOrSuffix(file)),
          R.propOr('', 'suffix'))),
      H.Maybe,
      R.prop(type),
      R.prop('output'))(config);
  });

  //P hasPrefix : Config => Boolean
  var hasPrefix = R.curry(function(config, file) {
    return R.compose(
      H.orElse(false),
      H.of(
        R.compose(
          R.ifElse(
            R.isEmpty,
              R.always(false),
              testPrefixOrSuffix(file)),
          R.propOr('', 'prefix'))),
      H.Maybe,
      R.prop(type),
      R.prop('output'))(config);
  });

  //P hasPrefixOrSuffix : Config => Boolean
  var hasPrefixOrSuffix = R.converge(R.or, hasPrefix, hasSuffix);

  var fileName = R.curry(function(config, file) {
    var fileWithSuffix = R.replace(R.concat('\.', type), suffix(config), file);
    var idx = R.strLastIndexOf('/', fileWithSuffix) + 1;
    var first = R.substringTo(idx, fileWithSuffix);
    var last = R.substringFrom(idx, fileWithSuffix);

    if (shallow(config)) {
      return path(config) + prefix(config) + last;
    }

    return path(config) + first + prefix(config) + last;
  });

  return {
    hasPrefixOrSuffix: hasPrefixOrSuffix,
    hasPrefix: hasPrefix,
    hasSuffix: hasSuffix,
    suffix: suffix,
    prefix: prefix,
    shallow: shallow,
    path: path,
    generatedFileName: fileName
  };
}
