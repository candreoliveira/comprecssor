var config = require('./mock/config1.json') || {};
var comprecssor = require('../index.js')(config);
comprecssor.exec();