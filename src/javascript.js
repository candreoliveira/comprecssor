var uglifyjs = require("uglify-js");

module.exports = function(R, H, S) {
  function uglify(content, options) {
    return uglifyjs.minify(content, options)
  }

  return {
    uglify: uglify
  };
}