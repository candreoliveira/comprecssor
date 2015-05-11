var regex = /(?:(?!\/*.*\*\/)(?!\#(?:[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}))(?!\[.*)(?!.*\])[\.\#](-?[_a-zA-Z]+[_a-zA-Z0-9-]*)+)/g;

module.exports = function(R){
  var getTokens = function(line) {
    return R.compose(
      R.uniq,
      R.map(R.tail),
      R.ifElse(R.isNil, R.always([]), R.identity)
    )(line.match(regex));
  }

  return {
    tokens: getTokens
  };
}