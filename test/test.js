var config = require('./config/config.json') || {};
var comprecssor = require('../index.js')(config);
comprecssor.exec();