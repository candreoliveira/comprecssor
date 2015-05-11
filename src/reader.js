var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

module.exports = function(file) {
  var instream = fs.createReadStream(file);
  var outstream = new stream;
  return readline.createInterface(instream, outstream);

  // rl.on('line', function(line) {
  //   // process line here
  //   H.log(line);
  // });

  // rl.on('close', function() {
  //   // do something on finish here
  //   H.log("FIM");
  // });
}
