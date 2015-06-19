module.exports = function(R, H, S){
  var O = require('./output.js')(R, H, S, 'html');
  var regex = /\b(?:id|class)\s*=\s*(?:["'])?([a-zA-Z0-9-_\s]*)(?:["'])?/g;

  return {
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