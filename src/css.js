var regex = /(?:(?!\/*.*\*\/)(?!\#(?:[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}))(?!\[.*)(?!.*\])[\.\#](-?[_a-zA-Z]+[_a-zA-Z0-9-]*)+)/g;

module.exports = function(R){
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
      R.map(R.compose(R.join(''), R.tail)),
      getType('#'))(tokens);
    var classes = R.compose(
      R.map(R.compose(R.join(''), R.tail)),
      getType('.'))(tokens);

    return {
      ids: ids,
      classes: classes,
      tokens: tokens
    }
  }


  return {
    tokens: getTokens
  };
}