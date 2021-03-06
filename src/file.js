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
      this.push(transform(chunk + ''), enc);
      cb();
    };

    return TransformFile(options);
  }

  return {
    readStream: fs.createReadStream,
    writeStream: fs.createWriteStream,
    truncate: fs.truncate,
    transformStream: transformStream,
    writeFile: fs.writeFile,
    readFileSync: fs.readFileSync,
    outputJson: fse.outputJson,
    ensureDir: fse.ensureDir,
    ensureFile: fse.ensureFile,
    glob: glob
  }
}