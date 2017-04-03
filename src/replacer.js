'use strict';

var util = require('util');

module.exports = function(match) {
   return util.format('[%s](bible://%s)', match.text, match.range);
};
