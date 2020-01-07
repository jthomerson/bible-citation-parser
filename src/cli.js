'use strict';

var BCP = require('../src/index'),
    parser = new BCP('english');

/* eslint-disable no-console,no-process-exit */

if (process.argv.length < 3) {
   console.log('ERROR: provide a string argument to parse for citations');
   process.exit(1);
}

console.log(JSON.stringify(parser.findMatches(process.argv[2]), null, 3));
