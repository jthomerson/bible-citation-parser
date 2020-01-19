'use strict';

const _ = require('underscore'),
      fs = require('fs'),
      allRanges = require('../data/all-ranges'),
      plans = require('../data/plans'),
      planName = process.argv[2],
      plan = plans[planName];

/* eslint-disable no-console */

if (_.isEmpty(planName) || !plans[planName]) {
   throw new Error(`Must supply a valid plan name argument ('${planName})`);
}

const allVerses = _.chain(allRanges)
   .map(([ start, end ]) => {
      const verses = [];

      for (let vs = start; vs <= end; vs++) {
         verses.push(vs);
      }

      return verses;
   })
   .flatten()
   .value()
   .sort((a, b) => {
      return Number(a) - Number(b);
   });

const includedVerses = [];

console.log(plan.name);
_.each(plan.entries, (entry) => {
   console.log('DAY: ' + entry.citation);
   console.log(entry.ranges);
   _.each(entry.ranges.split(','), (range) => {
      let [ start, end ] = range.split('-');

      if (end === undefined) {
         end = start;
      }

      start = Number(start);
      end = Number(end);

      if (end < start) {
         throw new Error(`Invalid data - ends before starts: ${start}-${end}`);
      }

      let startInd = _.sortedIndex(allVerses, start),
          endInd = _.sortedIndex(allVerses, end);

      if (allVerses[endInd] !== end) {
         endInd = endInd - 1;
      }

      console.log(`Start: ${start} = ${startInd} = ${allVerses[startInd]}`);
      console.log(`End:   ${end} = ${endInd} = ${allVerses[endInd]}`);

      for (let i = startInd; i <= endInd && i < allVerses.length; i++) {
         includedVerses.push(allVerses[i]);
      }
   });
});

console.log('Summary');
console.log(allVerses.length);
console.log(_.uniq(includedVerses).length);
console.log(_.difference(allVerses, includedVerses));
console.log(_.difference(includedVerses, allVerses));

writeVerses(allVerses, '/tmp/all.verses');
writeVerses(includedVerses, '/tmp/included.verses');

function writeVerses(verses, file) {
   verses = verses.slice().sort((a, b) => { return Number(a) - Number(b); });

   const str = _.reduce(verses, (memo, vs) => {
      return memo + `${vs}\n`;
   }, '');

   fs.writeFileSync(file, str); // eslint-disable-line no-sync
}
