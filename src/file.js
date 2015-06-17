var fs = require('fs');
var fse = require('fs-extra');
var util = require('util');
var glob = require('glob');
var stream = require('stream');
var Transform = stream.Transform;

module.exports = function() {
  function transformStream(transform, options) {
    function TransformFile(options) {
      // allow use without new
      if (!(this instanceof TransformFile)) {
        return new TransformFile(options);
      }

      // init Transform
      Transform.call(this, options);
    }

    util.inherits(TransformFile, Transform);

    TransformFile.prototype._transform = function (chunk, enc, cb) {
      var t = transform(chunk + '');
      //console.log(t);
      this.push(t, enc);
      cb();
    };

    return TransformFile(options);
  }

  return {
    readStream: fs.createReadStream,
    writeStream: fs.createWriteStream,
    transformStream: transformStream,
    writeFile: fs.writeFile,
    outputJson: fse.outputJson,
    glob: glob
  }
}