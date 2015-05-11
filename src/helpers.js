var Maybe = require('ramda-fantasy').Maybe;

module.exports = function(R) {
  var konsole = function(method) {
    return R.tap(function(x){
      R.invoke(method, ['********** ', x], console);
      return x;
    });
  }

  var run = R.curry(function(method, output, input){
    return R.invoke(method, [output], input);
  });

  var orElse = R.curry(function(output, input){
    return run('getOrElse', output, input);
  });

  var of = R.curry(function(output, input){
    return run('map', output, input);
  });

  return {
    log: konsole('log'),
    error: konsole('error'),
    warn: konsole('warn'),
    orElse: orElse,
    of: of,
    Maybe: Maybe
  };
}