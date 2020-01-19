'use strict';

const _ = require('underscore'),
      BCP = require('../index'),
      plans = require('../data/plans'),
      planName = process.argv[2],
      plan = plans[planName],
      parser = new BCP('english');

/* eslint-disable no-console */

if (_.isEmpty(planName) || !plans[planName]) {
   throw new Error(`Must supply a valid plan name argument ('${planName})`);
}

console.log(plan.name);
_.each(plan.days, (day) => {
   console.log('DAY: ' + day.title);
   console.log(day.description);
   _.each(day.ranges, (range) => {
      const matches = parser.findMatches(range.citation);

      if (matches.length === 0) {
         console.log(`ERROR: No matches found for ${range.citation}`);
      } else if (matches.length > 1) {
         const matchRanges = matches.map((m) => { return m.range; }).join(', ');

         console.log(`ERROR: too many matches for ${range.citation}: ${matchRanges}, expected ${range.range}`);
      } else if (matches[0].range !== range.range) {
         console.log(`ERROR: mismatched range for ${range.citation}: found ${matches[0].range}, expected ${range.range}`);
      }
   });
});
