// var config = require('./config/config.json') || {};
// var comprecssor = require('../index.js')(config);
// comprecssor.exec();

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      [1,2,3].indexOf(5).should.equal(-1);
      [1,2,3].indexOf(0).to.be.equal(-1);
    })
  })
})