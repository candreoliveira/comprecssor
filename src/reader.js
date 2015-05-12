var fs = require('fs');
module.exports = function(file) {
  return fs.createReadStream(file);

  // readableStream.on('data', function(chunk) {
  //     data+=chunk;
  // });

  // readableStream.on('end', function() {
  //     console.log(data);
  // });
}