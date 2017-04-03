'use strict';

var _ = require('underscore'),
    util = require('util'),
    Class = require('class.extend'),
    CH_VS = '(?:[0-9]+:)?[0-9]+(?:\\s*[-,]\\s*[0-9]+)*(?:\\s*;\\s*(?:[0-9]+:)?[0-9]+(?:\\s*[-,]\\s*[0-9]+)*)*';

function zpad(s) {
   if (s.length === 1) {
      return ('00' + s);
   } else if (s.length === 2) {
      return ('0' + s);
   }

   return s;
}

module.exports = Class.extend({

   init: function(language, books) {
      this._language = language;
      this._books = books;
      this._compilePattern();
   },

   _compilePattern: function() {
      var names, negatives, str;

      names = _.chain(this._books).pluck('matches').flatten().value();

      negatives = _.chain(names)
         .filter(function(name) {
            return /^[0-9]/.test(name);
         })
         .map(function(name) {
            return name.replace(/^[0-9]\s*/, '');
         })
         .value();

      str = util.format('(%s)\\.?\\s+(%s)(?!%s)', names.join('|'), CH_VS, negatives.join('|'));

      this._pattern = new RegExp(str, 'g');
   },

   findMatches: function(str) {
      var matches = [],
          result;

      if (_.isEmpty(str)) {
         return [];
      }

      // eslint-disable-next-line no-cond-assign
      while (result = this._pattern.exec(str)) {
         matches.push(this.convertToMatches(result.index, result[0], result[1], result[2]));
      }

      matches = _.chain(matches).flatten().filter().value();

      return matches;
   },

   convertToMatches: function(offset, matchedStr, bookStr, rangesStr) {
      var book = this.bookInfoFor(bookStr),
          parts = rangesStr.replace(/\s+/g, '').split(/\b/),
          prevGroupEnd = 0,
          prevGroup, groups;

      if (book.isSingleChapter && _.contains(parts, ':')) {
         // error state: single chapter books should not contain chapter:verse notation
         return false;
      }

      groups = (function() {
         var cnt = 0;

         return _.values(_.groupBy(parts, function(p) {
            if (p === ',' || p === ';') {
               cnt = cnt + 1;
            }
            return cnt;
         }));
      }());

      groups = _.chain(groups)
         .map(function(group) {
            var startsWithComma = (group[0] === ','),
                startsWithSemiColon = (group[0] === ';'),
                chapterSepInd = _.indexOf(group, ':'),
                hasChapterSeparator = (chapterSepInd !== -1),
                groupOffset = 0,
                groupEnd = 0;

            if (startsWithComma && hasChapterSeparator) {
               // error state: comma-separated groups can not contain chapter separator
               return false;
            }

            if (hasChapterSeparator && (chapterSepInd !== (startsWithSemiColon ? 2 : 1))) {
               // error state: chapter separator should be the second item in the array
               // (or third if the array starts with a semi-colon)
               return false;
            }

            if (startsWithComma && prevGroup === undefined) {
               // error state: can not start a group with a comma if there is no previous
               // group to append the unit (verse or chapter) to
               return false;
            }

            if (startsWithComma && _.contains(prevGroup, ':')) {
               // This is an additional verse (or verse range) for the previous
               // group, which was ch:vs or ch:vs-vs. Make a group that
               // contains the chapter from the previous group along with this
               // verse.
               group = [ _.first(prevGroup), ':' ].concat(_.rest(group));
            } else if (startsWithComma) {
               // The previous group was just a chapter reference (or a verse
               // reference for a single-chapter book), so this group is just
               // another one of the same.
               group = [ group[1] ];
            } else if (startsWithSemiColon) {
               group = _.rest(group);
            }

            if (startsWithComma) {
               groupOffset = matchedStr.indexOf(',', prevGroupEnd);
            } else if (startsWithSemiColon) {
               groupOffset = matchedStr.indexOf(';', prevGroupEnd);
            }

            (function() {
               var c;

               for (c = groupOffset; c < matchedStr.length; c++) {
                  if (/[0-9]/.test(matchedStr[c])) {
                     groupOffset = c;
                     break;
                  }
               }
            }());

            (function() {
               var c;

               for (c = groupOffset + 1; c < matchedStr.length; c++) {
                  if (/[,;]/.test(matchedStr[c])) {
                     groupEnd = (c - 1);
                     break;
                  }
               }
            }());

            prevGroup = group;
            prevGroupEnd = groupEnd;

            return { range: group, start: groupOffset, end: groupEnd };
         })
         .filter()
         .value();

      // reset the first group's start point to include the book
      groups[0].start = 0;
      // reset the last group's end point to be the end of the matched string
      _.last(groups).end = matchedStr.length - 1;

      _.each(groups, function(group) {
         var range;

         if (book.isSingleChapter) {
            range = this.makeVerseRange(book.number, 1, _.first(group.range), _.last(group.range));
         } else if (_.contains(group.range, ':')) {
            // multi-chapter book, ch:vs range
            range = this.makeVerseRange(book.number, _.first(group.range), group.range[2], _.last(group.range));
         } else {
            // multi-chapter book, just chapters
            range = this.makeVerseID(book.number, _.first(group.range), 0) + '-' + this.makeVerseID(book.number, _.last(group.range), 999);
         }

         group.range = range;
      }.bind(this));

      _.each(groups, function(group) {
         var len = group.end - group.start;

         group.text = matchedStr.substring(group.start, group.end + 1);
         group.start = offset + group.start;
         group.end = group.start + len;
         group.book = book;
      });

      return groups;
   },

   bookInfoFor: function(bkName) {
      return _.find(this._books, function(book) {
         return _.contains(book.matches, bkName);
      });
   },

   makeVerseRange: function(bkNum, chNum, start, end) {
      var startID = this.makeVerseID(bkNum, chNum, start);

      if (end !== undefined && end !== start) {
         return startID + '-' + this.makeVerseID(bkNum, chNum, end);
      }

      return startID;
   },

   makeVerseID: function(bkNum, chNum, vsNum) {
      return bkNum.toString() + zpad(chNum.toString()) + zpad(vsNum.toString());
   },

});
