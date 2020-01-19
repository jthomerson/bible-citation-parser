'use strict';

const _ = require('underscore'),
      plans = require('../data/plans'),
      planName = process.argv[2],
      plan = plans[planName];

/* eslint-disable no-console */

if (_.isEmpty(planName) || !plans[planName]) {
   throw new Error(`Must supply a valid plan name argument ('${planName})`);
}

const output = { name: plan.name, days: [] };

_.each(plan.entries, (entry, i) => {
   const citations = entry.citation.split(';').map((citation) => { return citation.trim(); }),
         ranges = entry.ranges.split(',');

   // console.log(`DAY ${i + 1}: ${entry.citation}`);
   // console.log(entry.ranges);

   if (citations.length !== ranges.length) {
      throw new Error(`Day ${i + 1}: ${citations.length} citations, ${ranges.length} ranges`);
   }

   output.days.push({
      number: i + 1,
      fullCitation: entry.citation,
      ranges: _.zip(citations, ranges).map(([ citation, range ]) => { return { citation, range }; }),
   });
});

console.log(JSON.stringify(output, null, 3));
