'use strict';

var _ = require('underscore'),
    Class = require('class.extend'),
    Matcher = require('./Matcher'),
    defaultReplacer = require('./replacer'),
    MATCHERS = {};

module.exports = Class.extend({

   init: function(language) {
      if (!MATCHERS[language]) {
         // eslint-disable-next-line global-require
         MATCHERS[language] = new Matcher(language, require('./book-info/' + language + '.json'));
      }
      this._matcher = MATCHERS[language];
   },


   /**
    * Parses a string, finding Bible citations within the string, returning
    * information about each match.
    *
    * @param String content containing Bible citations to find
    * @return Array[Object] array of Bible citation info objects
    */
   findMatches: function(str) {
      return this._matcher.findMatches(str);
   },

   /**
    * Parses a string, finding Bible citations within the string and replacing
    * them with a replacement string. Takes a callback that can be used to
    * determine what to replace each found Bible citation with.
    *
    * By default will replace the scripture citation with a markdown-style link
    * using a special bible:// pseudo-protocol link.
    *
    * For example: "The Bible starts with Ge 1:1 and ends with Re 22:21" would
    * become "The Bible starts with [Ge 1:1](bible://1001001) and ends with [Re
    * 22:21](bible://66022021)".
    *
    * The callback is passed a single instance of the match object, and is
    * expected to return a string that should be used to replace the original
    * citation in the text.
    *
    * @param String str the string to parse
    * @param Function cb (optional) the callback that determines replacement string
    */
   replaceCitations: function(str, cb) {
      var fn = cb || defaultReplacer,
          matches = this.findMatches(str),
          pieces = [];

      if (_.isEmpty(matches)) {
         return str;
      }

      pieces.push(str.substring(0, _.first(matches).start));

      _.each(matches, function(match, i) {
         pieces.push(fn(match) || '');

         if (i < (matches.length - 1)) {
            pieces.push(str.substring(match.end + 1, matches[i + 1].start));
         }
      });

      pieces.push(str.substring(_.last(matches).end + 1));

      return pieces.join('');
   },

});
